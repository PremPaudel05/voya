import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
export function AccountLink() {
  const { account } = useAccount();
  const { t } = usePreferences();
  return <Link to="/account" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-semibold text-muted hover:bg-surface whitespace-nowrap"><UserRound size={14} />{t(account ? 'My account' : 'Sign in')}</Link>;
}
