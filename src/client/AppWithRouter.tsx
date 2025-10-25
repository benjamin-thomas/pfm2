import { useSearchParams } from 'react-router-dom';
import type { Api } from './api-client/interface';
import App from './App';

type AppWithRouterProps = {
  api: Api;
};

/**
 * Wrapper component that reads URL params and passes them to App.
 * This keeps App pure and testable by separating URL concerns.
 */
export const AppWithRouter = ({ api }: AppWithRouterProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountParam = searchParams.get('account');
  const selectedAccountId = accountParam ? parseInt(accountParam, 10) : 0;

  const setSelectedAccountId = (accountId: number) => {
    setSearchParams((params) => {
      params.set('account', accountId.toString());
      return params;
    });
  };

  return (
    <App
      api={api}
      selectedAccountId={selectedAccountId}
      setSelectedAccountId={setSelectedAccountId}
    />
  );
};