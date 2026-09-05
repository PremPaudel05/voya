import { Link } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
export function AccountLink() {
  const { account } = useAccount();
  return <Link to="/account" className="inline-flex items-center gap-1.5 rounded-full border border-[#d9ccba] px-3 py-2 text-xs font-semibold text-[#6b5740] hover:bg-white whitespace-nowrap"><UserRound size={14} />{account ? 'My account' : 'Sign in'}</Link>;
}
