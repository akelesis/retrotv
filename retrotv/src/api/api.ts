export const API_URL = `http://${window.location.hostname}:3000`

export function authHeaders() {
  const token = localStorage.getItem('token') ?? ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}
