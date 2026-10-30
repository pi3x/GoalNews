// Keep this list in sync with the trusted admin UID allowlist in Firestore rules.
const ADMIN_UIDS = new Set([
  'gaPuzG1ULdUSskKUsciL1g79nh72',
  '5Oe5YOBOtfOGQsRJ3XUjr3kemnX2',
]);

const style = document.createElement('style');
style.textContent = `
  .goalnews-admin-badge {
    display: inline-grid;
    width: 1.05em;
    height: 1.05em;
    margin-inline-start: .35em;
    place-items: center;
    border-radius: 50%;
    background: #35c96f;
    color: #07170d;
    font: 900 .72em/1 system-ui, sans-serif;
    vertical-align: .08em;
    cursor: help;
    box-shadow: 0 0 10px #35c96f55;
  }
`;
document.head.appendChild(style);

export function appendAdminBadge(nameElement, uid) {
  if (!uid || !ADMIN_UIDS.has(uid)) return;
  const badge = document.createElement('span');
  badge.className = 'goalnews-admin-badge';
  badge.textContent = '✓';
  badge.title = 'Admin';
  badge.setAttribute('aria-label', 'Admin');
  nameElement.appendChild(badge);
}
