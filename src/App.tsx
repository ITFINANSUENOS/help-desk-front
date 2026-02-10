import { useRoutes, BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './modules/auth/context/AuthProvider';
import { appRoutes } from './routes/app.routes';

function AppRoutes() {
  const element = useRoutes(appRoutes);
  return element;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
