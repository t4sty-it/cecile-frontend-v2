
import { createBrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import SplashPage from './screens/splash/index.tsx';
import GraphPage from './screens/graph/index.tsx';
import { SelectionProvider } from './contexts/SelectionContext.tsx';
import DocsOverlay from './components/DocsOverlay/DocsOverlay.tsx';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        path: '/',
        element: <SplashPage/>
      },

      {
        path: 'graph',
        element: 
          <SelectionProvider>
            <GraphPage/>
          </SelectionProvider>,
        children: [
          {
            path: 'docs/:page?',
            element: <DocsOverlay/>
          }
        ]
      }
    ]
  },
])