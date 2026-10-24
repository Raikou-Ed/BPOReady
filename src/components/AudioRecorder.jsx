import React, { useRef, useState, useEffect, useMemo } from 'react';

const getTimestamp = () => Date.now();

function wavFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arrayBuffer = reader.result;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.decodeAudioData(arrayBuffer.slice(0), (buffer) => {
          const channels = buffer.numberOfChannels;
          const sampleRate = buffer.sampleRate;
          const format = 1;
          const bitDepth = 16;
          const bytesPerSample = bitDepth / 8;
          const blockAlign = channels * bytesPerSample;
          const dataLength = buffer.length * blockAlign;
          const wavBuffer = new ArrayBuffer(44 + dataLength);
          const view = new DataView(wavBuffer);

          const writeString = (offset, text) => {
            for (let i = 0; i < text.length; i += 1) {
              view.setUint8(offset + i, text.charCodeAt(i));
            }
          };

          writeString(0, 'RIFF');
          view.setUint32(4, 36 + dataLength, true);
          writeString(8, 'WAVE');
          view.setUint32(16, 16, true);
          view.setUint16(20, format, true);
          view.setUint16(22, channels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * blockAlign, true);
          view.setUint16(32, blockAlign, true);
          view.setUint16(34, bitDepth, true);
          writeString(36, 'data');
          view.setUint32(40, dataLength, true);

          let offset = 44;
          for (let i = 0; i < buffer.length; i += 1) {
            for (let channel = 0; channel < channels; channel += 1) {
              const sample = buffer.getChannelData(channel)[i];
              const intSample = Math.max(-1, Math.min(1, sample));
              view.setInt16(offset, intSample < 0 ? intSample * 0x8000 : intSample * 0x7fff, true);
              offset += 2;
            }
          }

          audioContext.close();
          resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
        }, (error) => {
          audioContext.close();
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Unable to decode recording'));
    reader.readAsArrayBuffer(blob);
  });
}

async function analyzeRecording(blob) {
  if (!window.AudioContext && !window.webkitAudioContext) return { signal: 0, consistency: 0 };

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const buffer = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const samples = buffer.getChannelData(0);
    const frameSize = Math.max(1, Math.floor(buffer.sampleRate * 0.05));
    let totalRms = 0;
    let activeFrames = 0;
    let frameCount = 0;

    for (let offset = 0; offset < samples.length; offset += frameSize) {
      const end = Math.min(offset + frameSize, samples.length);
      let squaredTotal = 0;
      for (let index = offset; index < end; index += 1) squaredTotal += samples[index] ** 2;
      const rms = Math.sqrt(squaredTotal / Math.max(1, end - offset));
      totalRms += rms;
      if (rms >= 0.015) activeFrames += 1;
      frameCount += 1;
    }

    await audioContext.close();
    const averageRms = totalRms / Math.max(1, frameCount);
    return {
      signal: Math.min(100, Math.round(averageRms * 2000)),
      consistency: Math.round((activeFrames / Math.max(1, frameCount)) * 100),
    };
  } catch (error) {
    console.warn('Unable to analyze recording quality', error);
    return { signal: 0, consistency: 0 };
  }
}

export default function AudioRecorder({
  onRecorded,
  onRecordingComplete,
  onStateChange,
  expectedText = '',
  showLiveTranscript = true,
  showVolumeMeter = true,
  compact = false,
  label = 'Speech Recording',
}) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(() => Boolean(navigator.mediaDevices?.getUserMedia));
  const [liveTranscript, setLiveTranscript] = useState('');
  const [liveVolume, setLiveVolume] = useState(0); // 0 to 100
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptRef = useRef('');
  const mediaStoppedRef = useRef(false);
  const recognitionEndedRef = useRef(true);
  const recordingDataRef = useRef(null);
  const startedAtRef = useRef(0);
  const isRecordingRef = useRef(false);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // Compute matched words against expectedText in real-time
  const matchAnalysis = useMemo(() => {
    if (!expectedText) return null;
    const cleanWord = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

    const expectedTokens = expectedText
      .split(/\s+/)
      .map(w => ({ raw: w, clean: cleanWord(w) }))
      .filter(item => item.clean.length > 0);

    const spokenTokens = (liveTranscript || '')
      .split(/\s+/)
      .map(cleanWord)
      .filter(w => w.length > 0);

    const spokenBag = {};
    spokenTokens.forEach(w => {
      spokenBag[w] = (spokenBag[w] || 0) + 1;
    });

    const matchedIndices = new Set();
    let matchCount = 0;
    const tempBag = { ...spokenBag };

    expectedTokens.forEach((item, idx) => {
      if (tempBag[item.clean] && tempBag[item.clean] > 0) {
        matchedIndices.add(idx);
        tempBag[item.clean] -= 1;
        matchCount += 1;
      }
    });

    const totalWords = expectedTokens.length;
    const accuracy = totalWords > 0 ? Math.round((matchCount / totalWords) * 100) : 0;

    return {
      expectedTokens,
      matchedIndices,
      matchCount,
      totalWords,
      accuracy,
      spokenCount: spokenTokens.length,
    };
  }, [expectedText, liveTranscript]);

  const finishRecordingIfReady = () => {
    if (!mediaStoppedRef.current || !recognitionEndedRef.current || !recordingDataRef.current) return;
    const { blob, durationSeconds, audioMetrics } = recordingDataRef.current;
    const cb = onRecorded || onRecordingComplete;
    if (cb) {
      cb(blob, durationSeconds, transcriptRef.current, audioMetrics);
    }
    recordingDataRef.current = null;
  };

  const start = async () => {
    if (!supported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      transcriptRef.current = '';
      setLiveTranscript('');
      setElapsedSeconds(0);
      mediaStoppedRef.current = false;
      isRecordingRef.current = true;

      // Start elapsed timer
      startedAtRef.current = getTimestamp();
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);

      // --- 1. Real-Time Volume Analyser ---
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.6;
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolumeLoop = () => {
            if (!isRecordingRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i += 1) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Map average to 0 - 100 with boosted response for vocal range
            const normalized = Math.min(100, Math.round((average / 110) * 100));
            setLiveVolume(normalized);
            rafRef.current = requestAnimationFrame(updateVolumeLoop);
          };
          rafRef.current = requestAnimationFrame(updateVolumeLoop);
        }
      } catch (volumeErr) {
        console.warn('Real-time volume analyzer could not be initialized:', volumeErr);
      }

      // --- 2. Live Web Speech Recognition ---
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognitionEndedRef.current = false;

          recognition.addEventListener('result', (event) => {
            const nextTranscript = Array.from(event.results)
              .map(result => result[0]?.transcript ?? '')
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();

            if (nextTranscript) {
              transcriptRef.current = nextTranscript;
              setLiveTranscript(nextTranscript);
            }
          });

          recognition.addEventListener('error', (event) => {
            console.warn('SpeechRecognition error:', event.error);
            recognitionEndedRef.current = true;
            finishRecordingIfReady();
          });

          recognition.addEventListener('end', () => {
            recognitionEndedRef.current = true;
            finishRecordingIfReady();
          });

          recognitionRef.current = recognition;
          recognition.start();
        } catch (recognitionError) {
          console.warn('SpeechRecognition failed to start:', recognitionError);
          recognitionEndedRef.current = true;
        }
      } else {
        recognitionEndedRef.current = true;
      }

      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const durationSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        try {
          const wavBlob = await wavFromBlob(webmBlob);
          const audioMetrics = await analyzeRecording(wavBlob);
          recordingDataRef.current = { blob: wavBlob, durationSeconds, audioMetrics: audioMetrics || { signal: 0, consistency: 0 } };
        } catch (error) {
          console.warn('WAV conversion failed, falling back to original recorded blob', error);
          recordingDataRef.current = { blob: webmBlob, durationSeconds, audioMetrics: { signal: 0, consistency: 0 } };
        }
        mediaStoppedRef.current = true;
        finishRecordingIfReady();

        setTimeout(() => {
          if (!recognitionEndedRef.current || recordingDataRef.current) {
            recognitionEndedRef.current = true;
            finishRecordingIfReady();
          }
        }, 350);

        stream.getTracks().forEach(t => t.stop());
      });

      mediaRecorder.start();
      setRecording(true);
      onStateChange && onStateChange(true);
    } catch (err) {
      console.error('Unable to start recording', err);
      setSupported(false);
    }
  };

  const stop = () => {
    isRecordingRef.current = false;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
    }
    setLiveVolume(0);

    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          recognitionEndedRef.current = true;
        }
      }
      setRecording(false);
      onStateChange && onStateChange(false);
    }
  };

  // Determine volume feedback status
  const volumeStatus = useMemo(() => {
    if (!recording) return { text: 'Microphone Standby', color: 'text-gray-400 bg-gray-100', dot: 'bg-gray-400' };
    if (liveVolume < 8) return { text: 'Silence / Speak into Mic', color: 'text-amber-700 bg-amber-50 border border-amber-200', dot: 'bg-amber-500' };
    if (liveVolume <= 65) return { text: 'Optimal Voice Volume ✓', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200', dot: 'bg-emerald-500' };
    return { text: 'Strong / Loud Volume', color: 'text-blue-700 bg-blue-50 border border-blue-200', dot: 'bg-blue-500' };
  }, [recording, liveVolume]);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {!supported && (
        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 w-full text-center">
          Audio recording is not supported in this browser. Please use Chrome or Edge.
        </div>
      )}

      {/* Main Recording Bar */}
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Record / Stop Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (recording ? stop() : start())}
            className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-sm ${
              recording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {recording ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                <span>Stop Recording ({elapsedSeconds}s)</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                <span>{elapsedSeconds > 0 ? 'Record Again' : 'Start Recording'}</span>
              </>
            )}
          </button>

          {/* Recording Timer Badge */}
          {recording && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>Recording: {elapsedSeconds}s</span>
            </div>
          )}
        </div>

        {/* Real-time Voice Volume Meter */}
        {showVolumeMeter && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>Voice Volume</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${volumeStatus.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${volumeStatus.dot}`}></span>
                  {volumeStatus.text}
                </span>
              </div>

              {/* Dynamic Equalizer / Level Meter Bars */}
              <div className="flex items-end gap-1 mt-1.5 h-5 px-1 py-0.5 bg-gray-100 rounded-md">
                {[...Array(14)].map((_, i) => {
                  const threshold = (i + 1) * 7.1; // 14 bars up to 100%
                  const isActive = recording && liveVolume >= threshold;
                  let barColor = 'bg-gray-300';
                  if (isActive) {
                    if (i < 8) barColor = 'bg-emerald-500';
                    else if (i < 11) barColor = 'bg-yellow-500';
                    else barColor = 'bg-red-500';
                  }
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-sm transition-all duration-75 ${barColor}`}
                      style={{
                        height: isActive ? `${Math.min(100, Math.max(25, (i + 1) * 7.5))}%` : '20%',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Live Speech Transcription & Reading Match Panel --- */}
      {showLiveTranscript && (recording || liveTranscript) && (
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3.5 transition-all">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${recording ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`}></span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                {recording ? 'Live Speech Transcription (Listening...)' : 'Transcribed Spoken Text'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span>{liveTranscript ? liveTranscript.trim().split(/\s+/).length : 0} words spoken</span>
            </div>
          </div>

          {/* Real-time Streaming Transcript Output */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 leading-relaxed min-h-[50px] font-medium">
            {liveTranscript ? (
              <span>"{liveTranscript}"</span>
            ) : (
              <span className="text-gray-400 italic">Listening... Start reading or speaking into your microphone.</span>
            )}
          </div>

          {/* --- Real-Time Word Matching & Reading Accuracy (When expectedText is present) --- */}
          {matchAnalysis && (
            <div className="pt-2 border-t border-gray-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Reading Accuracy Verification
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  matchAnalysis.accuracy >= 75
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : matchAnalysis.accuracy >= 50
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {matchAnalysis.accuracy}% Match ({matchAnalysis.matchCount}/{matchAnalysis.totalWords} words)
                </span>
              </div>

              {/* Real-Time Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    matchAnalysis.accuracy >= 75 ? 'bg-emerald-500' : matchAnalysis.accuracy >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${matchAnalysis.accuracy}%` }}
                />
              </div>

              {/* Word-by-word visual matching display */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-xs leading-relaxed">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Word Verification (Green = Read Correctly):
                </p>
                <div className="flex flex-wrap gap-1">
                  {matchAnalysis.expectedTokens.map((item, idx) => {
                    const isMatched = matchAnalysis.matchedIndices.has(idx);
                    return (
                      <span
                        key={idx}
                        className={`px-1 py-0.5 rounded text-xs transition-colors ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
                            : 'text-gray-500 bg-white border border-gray-200'
                        }`}
                      >
                        {item.raw}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
