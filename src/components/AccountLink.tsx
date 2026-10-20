import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
export function AccountLink() {
  const { account } = useAccount();
  const { t } = usePreferences();
  return <Link to="/account" className="auth-black account-nav-login"><UserRound size={14} />{t(account ? 'My account' : 'Sign up / Sign in')}</Link>;
}
