import { BrowserRouter } from 'react-router-dom';
import WebRouter from './routers/WebRouter';
import { ThemeProvider } from '@mui/material';
import { muiTheme } from './utils/muiTheme';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { CustomToastContainer } from './components/CustomToastContainer';
import { startConnectivityMonitor } from './offline/connectivity';

function App() {

  const { user } = useAuth();

  // watch whether the server can be reached, so the till knows when to work offline
  useEffect(() => { startConnectivityMonitor(); }, []);

  // Dynamic favicon & page title updates
  useEffect(() => {
    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    const storedLogo = localStorage.getItem('lastUploadedLogo');
    
    if (favicon) {
      if (user?.restaurant?.logo) {
        favicon.href = user.restaurant.logo;
      } else {
        favicon.href = storedLogo || "/favicon.png";
      }
    }
    
    document.title = user?.restaurant?.name 
      ? `${user.restaurant.name} - Auvren Till` 
      : "Auvren Till";
  }, [user]);


  return (
    <>
      <BrowserRouter>
        <ThemeProvider theme={muiTheme}>
          <WebRouter />
        </ThemeProvider>
      </BrowserRouter>
      <CustomToastContainer />
    </>
  );
}

export default App;
