import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
export function AccountLink() {
  const { account } = useAccount();
  const { t } = usePreferences();
  return <Link to="/account" className="inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 rounded-full bg-action text-action-ink text-xs font-semibold hover:bg-action-hover transition-colors whitespace-nowrap"><UserRound size={14} />{t(account ? 'My account' : 'Sign up / Sign in')}</Link>;
}
