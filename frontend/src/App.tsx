import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { FontProvider } from './contexts/FontContext';

function App() {
  return (
    <FontProvider>
      <RouterProvider router={router} />
    </FontProvider>
  );
}

export default App;