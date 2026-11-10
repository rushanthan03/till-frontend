import { BrowserRouter } from 'react-router-dom';
import WebRouter from './routers/WebRouter';
import { ThemeProvider } from '@mui/material';
import { muiTheme } from './utils/muiTheme';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { CustomToastContainer } from './components/CustomToastContainer';

function App() {

  const { user } = useAuth();

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
