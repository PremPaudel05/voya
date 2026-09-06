import { useEffect, useState } from 'react';
import { greetingFor, millisecondsUntilNextGreeting } from './greeting';

export function useTimeOfDayGreeting() {
  const [greeting, setGreeting] = useState(() => greetingFor());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // Recheck at least once a minute to catch device clock/timezone changes.
      timer = setTimeout(refresh, Math.min(millisecondsUntilNextGreeting(), 60_000));
    };
    const refresh = () => {
      clearTimeout(timer);
      setGreeting(greetingFor());
      schedule();
    };
    const resume = () => { if (!document.hidden) refresh(); };
    schedule();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', resume);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);
  return greeting;
}
