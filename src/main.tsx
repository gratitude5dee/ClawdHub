import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import App from './App';
import './styles.css';

const client = createThirdwebClient({
  clientId: 'YOUR_THIRDWEB_CLIENT_ID', // Replace with your thirdweb client ID
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThirdwebProvider>
      <App client={client} />
    </ThirdwebProvider>
  </React.StrictMode>,
);
