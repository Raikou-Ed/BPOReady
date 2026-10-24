export const CALL_SCENARIOS = [
  {
    id: 1,
    call_type: "inbound",
    title: "Technical Support: DSL Internet Outage",
    category: "Technical Support",
    difficulty: "medium",
    duration_estimate: "4-5 mins",
    customer_name: "Sarah Sky",
    customer_phone: "+1 (860) 995-1234",
    account_number: "860-995-1234",
    scenario_brief: "An upset customer calling because her DSL internet is completely down and she cannot access her work email. The DSL light on her modem is flashing red.",
    dialogues: [
      {
        turn: 1,
        audio_url: "/audio/call_simulation/call1/RecC1.m4a",
        customer_text: "I'm sorry, can you please repeat yourself?",
        suggested_agent_text: "Thank you for calling Technical Support, my name is Patrick. How can I help you today?"
      },
      {
        turn: 2,
        audio_url: "/audio/call_simulation/call1/RecC2.m4a",
        customer_text: "Well, before I give you my account information, I just wanna let you know that I'm really pissed. I can't access my email for almost a week now. I'm paying you guys lots of money, and you can't even provide a decent service. What's wrong with you people? YOUR SERVICE SUCKS!!!",
        suggested_agent_text: "I'm sorry, can you hear me OK now? My name is Patrick. How can I help you today? Can I ask for your name and account number?"
      },
      {
        turn: 3,
        audio_url: "/audio/call_simulation/call1/RecC3.m4a",
        customer_text: "Sure, my account number is 860-995-1234.",
        suggested_agent_text: "I'm really sorry for the inconvenience, Ms. Sky; I would probably feel the exact same way if I were in your situation. But don't worry, I promise we'll get your issue resolved today. May I get your account number so we can check your account, would that be ok?"
      },
      {
        turn: 4,
        audio_url: "/audio/call_simulation/call1/RecC4.m4a",
        customer_text: "It's Sarah Sky, I am the account holder.",
        suggested_agent_text: "Got it, may I please verify the primary account holder's full name on the account?"
      },
      {
        turn: 5,
        audio_url: "/audio/call_simulation/call1/RecC5.m4a",
        customer_text: "I'm sorry, I'm having a hard time hearing, can you please repeat your question?",
        suggested_agent_text: "Thank you for verifying, Ms. Sky. Can we call you back at the same number, or do you have a better callback number?"
      },
      {
        turn: 6,
        audio_url: "/audio/call_simulation/call1/RecC6.m4a",
        customer_text: "Yes, that's a good call back number.",
        suggested_agent_text: "Sure! I was just asking if we can call you at the same number you gave me, or if you have a better callback number?"
      },
      {
        turn: 7,
        audio_url: "/audio/call_simulation/call1/RecC7.m4a",
        customer_text: "I've gone through the steps, believe me, I've checked everything before calling you!",
        suggested_agent_text: "Ok, based on our test results, it shows here that you are not getting a DSL signal, that's why you can't get online or check your email. We can actually fix this problem over the phone, but I will need to walk you through some steps, would that be ok?"
      },
      {
        turn: 8,
        audio_url: "/audio/call_simulation/call1/RecC8.m4a",
        customer_text: "Fine! I have Power and Ethernet lights green on my modem. But, the 3rd light is flashing red, which is the DSL light. Are you happy now?",
        suggested_agent_text: "Oh, that's good then, but can you at least check for me which lights are lit up on your modem?"
      },
      {
        turn: 9,
        audio_url: "/audio/call_simulation/call1/RecC9.m4a",
        customer_text: "Well, that's good then, I'll be a happy camper!",
        suggested_agent_text: "Thank you for your patience! As you noticed, the DSL light is flashing red on your modem. That means you are not getting any DSL signal. The good thing is, based on our initial test results, we do not have network outages in your area. That means we might be able to fix the problem over the phone!"
      },
      {
        turn: 10,
        audio_url: "/audio/call_simulation/call1/RecC10.m4a",
        customer_text: "It's right behind my desk, do you want me to crawl down the floor again?",
        suggested_agent_text: "You might have already checked on it, but since we have the DSL light flashing red on your modem, it indicates something could be loose on the DSL line. It's the gray phone cord at the back of the modem."
      },
      {
        turn: 11,
        audio_url: "/audio/call_simulation/call1/RecC11.m4a",
        customer_text: "Ok, but, this is the last step that I'll do. Don't hang up.",
        suggested_agent_text: "Well, if I send someone out and they find out that there's just a loose phone cord, you will get charged for the dispatch. We want to resolve the problem over the phone to avoid dispatch charges and save your time. That's all we need to check."
      },
      {
        turn: 12,
        audio_url: "/audio/call_simulation/call1/RecC12.m4a",
        customer_text: "Oh my goodness, the gray phone cord was just loose, let me plug that in... Oh my, there's now a steady green light on the DSL light of the modem, let me just try now the Internet!",
        suggested_agent_text: "Don't worry, I won't hang up on you. I am staying right here with you on the line."
      },
      {
        turn: 13,
        audio_url: "/audio/call_simulation/call1/RecC13.m4a",
        customer_text: "You are a miracle worker! Thank you so much! It got me now on my homepage and email!",
        suggested_agent_text: "Wow, that's good to know! Let's just see if you can now get online before we hang up. Can you try one or two more websites and your email?"
      },
      {
        turn: 14,
        audio_url: "/audio/call_simulation/call1/RecC14.m4a",
        customer_text: "I feel so stupid for calling you about this. But, I surely appreciate your time and patience!",
        suggested_agent_text: "No, you did a great job following the steps! You did great today! But do you have anymore questions or other concerns?"
      },
      {
        turn: 15,
        audio_url: null,
        customer_text: "Thank you for choosing Rocket Speed Internet. (Call Resolved)",
        suggested_agent_text: "You are welcome. We are open 24/7 just in case that you'll need our help again. And again, my name is Patrick, we do value your business and thank you for choosing Rocket Speed Internet. Have a blessed day!"
      }
    ]
  },
  {
    id: 2,
    call_type: "inbound",
    title: "Banking Support: Account Balance & Wire Transfer",
    category: "Financial Services",
    difficulty: "easy",
    duration_estimate: "2-3 mins",
    customer_name: "Claudin D.",
    customer_phone: "+1 (805) 784-5389",
    account_number: "805-7845-3895-061",
    scenario_brief: "A customer calls Bank of Wealth to verify her available checking balance and asks about processing timelines for an international wire transfer to Lloyds of London.",
    dialogues: [
      {
        turn: 1,
        audio_url: "/audio/call_simulation/call2/Inbound2Rec1.m4a",
        customer_text: "I would like to know my remaining money in my account.",
        suggested_agent_text: "It's a great day at Bank of Wealth, my name is Patrick! How can I assist you today?"
      },
      {
        turn: 2,
        audio_url: "/audio/call_simulation/call2/Inbound2Rec2.m4a",
        customer_text: "Sure, it's Claudin D., account number is 805-7845-3895-061.",
        suggested_agent_text: "I will be glad to help you. May I please have your account number and the full name on the account?"
      },
      {
        turn: 3,
        audio_url: "/audio/call_simulation/call2/Inbound2Rec3.m4a",
        customer_text: "It is 1234.",
        suggested_agent_text: "Thank you, let me just check on it. Ok, can you please verify the last four numbers of your social security ID?"
      },
      {
        turn: 4,
        audio_url: "/audio/call_simulation/call2/Inbound2Rec4.m4a",
        customer_text: "Yes, If I transfer it to my bank account in Lloyds of London, how long will it take?",
        suggested_agent_text: "You still have 84 thousand and 65 cents. Is there anything else that I could assist you with?"
      },
      {
        turn: 5,
        audio_url: "/audio/call_simulation/call2/Inbound2Rec5.m4a",
        customer_text: "Oh, I see, never mind, I'll just do it after the holidays. Thanks for your help.!",
        suggested_agent_text: "If we do the transaction over the phone or online, our team will still contact you for verification prior sending your money to a different bank. The whole process usually just takes 2-3 business days."
      },
      {
        turn: 6,
        audio_url: null,
        customer_text: "Thank you for banking with Bank of Wealth. (Call Resolved)",
        suggested_agent_text: "You are very welcome, Ms. Claudin! Have a wonderful day and thank you for calling Bank of Wealth, goodbye!"
      }
    ]
  },
  {
    id: 3,
    call_type: "outbound",
    title: "Deluxe Credit Card: Platinum Upgrade Offer",
    category: "Outbound Sales & Loyalty",
    difficulty: "medium",
    duration_estimate: "3-4 mins",
    customer_name: "Anastasia Robinson",
    customer_phone: "+1 (213) 897-0362",
    account_number: "CC-9014-VALUED",
    scenario_brief: "Outbound loyalty rewards call offering an exclusive pre-approved Platinum MasterCard upgrade with waived lifetime annual fees and comprehensive travel perks.",
    dialogues: [
      {
        turn: 1,
        audio_url: "/audio/call_simulation/call3/OutboundRec1.m4a",
        customer_text: "Yes, this is her.",
        suggested_agent_text: "Good morning! My name is Patrick calling from Deluxe Credit Card. May I speak with Ms. Anastasia Robinson?"
      },
      {
        turn: 2,
        audio_url: "/audio/call_simulation/call3/OutboundRec2.m4a",
        customer_text: "Okay, go ahead.",
        suggested_agent_text: "Hi, Ms. Robinson! I'm calling with wonderful news regarding your account. Do you have 3 to 5 minutes to discuss an exclusive reward?"
      },
      {
        turn: 3,
        audio_url: "/audio/call_simulation/call3/OutboundRec3.m4a",
        customer_text: "Thank you, appreciate it. So, what do I get from that platinum?",
        suggested_agent_text: "We appreciate your 8 years as a valued cardholder! We want to reward you with our Platinum MasterCard, featuring a lifetime waived annual fee and higher credit limit."
      },
      {
        turn: 4,
        audio_url: "/audio/call_simulation/call3/OutboundRec4.m4a",
        customer_text: "Okay, that sounds good.",
        suggested_agent_text: "With Platinum, you enjoy non-expiring reward points, $20,000 complimentary travel insurance, and airport Sky View lounge access worldwide!"
      },
      {
        turn: 5,
        audio_url: "/audio/call_simulation/call3/OutboundRec5.m4a",
        customer_text: "Okay, my billing address is Apartment 152, Emerald Building, Rock Street, Los Angeles, California. Email is AnnaRobinson@aol.com. And my phone is 213-897-0362.",
        suggested_agent_text: "Since you are already pre-approved, I just need to quickly verify your billing address, phone number, and email address to process the delivery."
      },
      {
        turn: 6,
        audio_url: "/audio/call_simulation/call3/OutboundRec6.m4a",
        customer_text: "Thank you, bye.",
        suggested_agent_text: "Got it! Your card has been submitted and will arrive in 10 business days. Thank you for your continued loyalty to Deluxe Credit Card, have a great day!"
      }
    ]
  },
  {
    id: 4,
    call_type: "outbound",
    title: "Kwestyon Telecom: High-Speed Fiber Upgrade",
    category: "Telecommunications & Retention",
    difficulty: "hard",
    duration_estimate: "4-6 mins",
    customer_name: "Vanessa Roberts",
    customer_phone: "+1 (352) 809-1142",
    account_number: "FBR-33576-SAN",
    scenario_brief: "Outbound consultation for a customer experiencing 4K TV streaming buffering, guiding her through a live speed test and matching her budget with an affordable $25/month 100 Mbps fiber plan.",
    dialogues: [
      {
        turn: 1,
        audio_url: "/audio/call_simulation/call4/outb2Rec1.m4a",
        customer_text: "Uh, for now, it's fine, but I might be busy soon. But we can talk about it now.",
        suggested_agent_text: "Hello, hello, good morning. My name is Patrick calling from Kwestyon Telecom. The reason for my call today is about the form you filled out on our website for our Fiber plans. Have I caught you at a good time?"
      },
      {
        turn: 2,
        audio_url: "/audio/call_simulation/call4/outb2Rec2.m4a",
        customer_text: "That's correct.",
        suggested_agent_text: "Perfect. First, I'd like to quickly confirm your address and see if it's part of our serviceable locations. What we have here is 11345 Cay Spruce Way, San Antonio, Florida, 33576. Is this correct?"
      },
      {
        turn: 3,
        audio_url: "/audio/call_simulation/call4/outb2Rec3.m4a",
        customer_text: "Uhm, actually, I was just curious if my location's serviceable for Fiber, but I'm not really actively looking to switch right now. I'm kind of happy with my current provider, so...",
        suggested_agent_text: "Perfect. So this address is eligible for a Fiber connection. We can provide you with the service. Would you like to know more about our available plans?"
      },
      {
        turn: 4,
        audio_url: "/audio/call_simulation/call4/outb2Rec4.m4a",
        customer_text: "Uhm, I'm not sure. I haven't really checked.",
        suggested_agent_text: "I understand. This is just going to be a discovery call to see if there are areas where we might be able to help you out with. If I could ask you real quick, how much is the average speed you're getting from your current provider?"
      },
      {
        turn: 5,
        audio_url: "/audio/call_simulation/call4/outb2Rec5.m4a",
        customer_text: "BC&C.",
        suggested_agent_text: "And what's your current provider?"
      },
      {
        turn: 6,
        audio_url: "/audio/call_simulation/call4/outb2Rec6.m4a",
        customer_text: "Uhm, all sorts of things. But mainly just browsing, FaceTime, and streaming, most of all.",
        suggested_agent_text: "And what do you usually use your connection for? Browsing, gaming, streaming?"
      },
      {
        turn: 7,
        audio_url: "/audio/call_simulation/call4/outb2Rec7.m4a",
        customer_text: "Uh... (Sighs.) I wouldn't say totally happy. But mostly, it's acceptable. When watching videos at 4K there's definitely some lagging. Doesn't matter which device, on our phones, on our TV. It would just freeze for a few seconds and then resume. I'm guessing it's the connection because it's definitely not the device. We just bought this 4K TV last month and it's been happening like clockwork every time we watch in 4K. Other than that, it's fine.",
        suggested_agent_text: "Mm-hmm. And are you totally happy with how the speed performs for each of these activities or do you think it could do better in some aspects?"
      },
      {
        turn: 8,
        audio_url: "/audio/call_simulation/call4/outb2Rec8.m4a",
        customer_text: "Oh, really? I wasn't exactly aware of that.",
        suggested_agent_text: "Hmm, you know when streaming 4K videos, you'd normally need 25 megabits per second to effectively load without lagging. Anything lower than 25, it would definitely slow you down one way or another."
      },
      {
        turn: 9,
        audio_url: "/audio/call_simulation/call4/outb2Rec9.m4a",
        customer_text: "No. But now that you raise that, I'm actually curious since I haven't checked the speed before, huh. All right, let me just go to my computer. What do you want me to do?",
        suggested_agent_text: "Tell you what, Vanessa, why don't we test your connection and see how much speed you're exactly getting? Because I think you're getting less than 25. Or if you are, chances are, it's not a consistent 25 throughout the day. Are you in front of your computer right now?"
      },
      {
        turn: 10,
        audio_url: "/audio/call_simulation/call4/outb2Rec10.m4a",
        customer_text: "Uh-huh. Speedtest.net... okay.",
        suggested_agent_text: "So if you could just open a browser and go to speedtest.net..."
      },
      {
        turn: 11,
        audio_url: "/audio/call_simulation/call4/outb2Rec11.m4a",
        customer_text: "Okay. It says... Ooh wow, this thing's moving!",
        suggested_agent_text: "And then click Go once you're there."
      },
      {
        turn: 12,
        audio_url: "/audio/call_simulation/call4/outb2Rec12.m4a",
        customer_text: "Okay, it says 8.19 and there's another wheel coming up. I guess that'll be the upload speed?",
        suggested_agent_text: "Yup, that's the meter. The first number should be your download speed."
      },
      {
        turn: 13,
        audio_url: "/audio/call_simulation/call4/outb2Rec13.m4a",
        customer_text: "Ha! So now it says 17.43. So 8.19 and 17.43. So definitely not enough, huh?",
        suggested_agent_text: "Yup, that'll be the upload speed."
      },
      {
        turn: 14,
        audio_url: "/audio/call_simulation/call4/outb2Rec14.m4a",
        customer_text: "Oh wow, so that explains the lagging, then?",
        suggested_agent_text: "No, definitely not enough to load 4K. You know, when streaming videos, we need to look at your download speed; how much megabits you're downloading from the web per second. Your download speed is 8.19. That's good enough for 1080 but definitely not for 4K. Because you see, 4K, technically is four times the size of 1080. So that's like 2 million pixels versus 8 million pixels per second."
      },
      {
        turn: 15,
        audio_url: "/audio/call_simulation/call4/outb2Rec15.m4a",
        customer_text: "Okay?",
        suggested_agent_text: "Oh definitely! There's no doubt about it. And that's what I'm calling you about today, Vanessa. If you want to make the most out of your 4K TV, then, I have something much faster for you with an attractive pricing."
      },
      {
        turn: 16,
        audio_url: "/audio/call_simulation/call4/outb2Rec16.m4a",
        customer_text: "Well that sounds great, but how much is it?",
        suggested_agent_text: "You could get up to 800 megabits per second which is roughly a hundred times faster than your current download speed. Would you like to know more about the available plans?"
      },
      {
        turn: 17,
        audio_url: "/audio/call_simulation/call4/outb2Rec17.m4a",
        customer_text: "Um... Okay, I don't know, that's kind of too much for me. I don't think we're willing to pay that much. Our Internet's a little slow but it works for us most of the time so... I don't think so.",
        suggested_agent_text: "It depends on the plan, but 800 Mbps starts as low as $50/month plus installation fees."
      },
      {
        turn: 18,
        audio_url: "/audio/call_simulation/call4/outb2Rec18.m4a",
        customer_text: "About $30, $33? Something like that. That's kind of like my price range. I don't think I want to be paying any higher than that.",
        suggested_agent_text: "Okay, how much do you pay monthly for your current connection?"
      },
      {
        turn: 19,
        audio_url: "/audio/call_simulation/call4/outb2Rec19.m4a",
        customer_text: "Oh, okay.",
        suggested_agent_text: "Okay, okay. I get you. Let me check here..okay? Because I might have something more suitable for you."
      },
      {
        turn: 20,
        audio_url: "/audio/call_simulation/call4/outb2Rec20.m4a",
        customer_text: "$25 for how much, how much speed?",
        suggested_agent_text: "What if I tell you you can get 100 Mbps for only $25? With free installation fee."
      },
      {
        turn: 21,
        audio_url: "/audio/call_simulation/call4/outb2Rec21.m4a",
        customer_text: "Hmm, that's getting interesting. Um, but first, I'm going to have to talk to my husband about it. I also have to go to work now. Can you call me later after work this evening?",
        suggested_agent_text: "100 megabits. Not as fast as 800 but definitely 12 times faster than your current download speed, more than enough to play 4K, and cheaper than $33. How does that sound?"
      },
      {
        turn: 22,
        audio_url: "/audio/call_simulation/call4/outb2Rec22.m4a",
        customer_text: "7:00 should be fine.",
        suggested_agent_text: "Sure, I can call you back at 6:00 or 7:00 this evening. Which do you prefer?"
      },
      {
        turn: 23,
        audio_url: "/audio/call_simulation/call4/outb2Rec23.m4a",
        customer_text: "You too, Bye.",
        suggested_agent_text: "Alright then, thank you for your time, Vanessa. I'll call you back at 7:00 in the evening today, have a good day!"
      }
    ]
  }
];
