import React from 'react';
import AppRoutes from './routes/AppRoutes';
import { useStandardsSync } from './hooks/useStandardsSync';

function App() {
  useStandardsSync();
  return <AppRoutes />;
}

export default App;
