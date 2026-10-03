export const session = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('session'))
    } catch {
      return null
    }
  },
  set: (value) => localStorage.setItem('session', JSON.stringify(value)),
  clear: () => localStorage.removeItem('session'),
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = session.get()?.token
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })
  const data = await res.json().catch(() => ({}))

  if (res.status === 401 && token) {
    session.clear()
    window.dispatchEvent(new Event('logout'))
  }
  if (!res.ok) {
    throw Object.assign(new Error(data.error ?? 'Something went wrong.'), { errors: data.errors ?? {}, status: res.status })
  }
  return data
}
