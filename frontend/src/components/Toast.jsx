import { useAuth } from '../context/AuthContext';

export default function Toast() {
  const { toastMsg, toastVisible } = useAuth();
  return (
    <div id="tw-toast" className={toastVisible ? 'show' : ''}>
      <div className="toast-check">✓</div>
      <div className="toast-msg">{toastMsg}</div>
    </div>
  );
}
