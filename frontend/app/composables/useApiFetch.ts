

export function useApiFetch<T>(url: string, options: any = {}) {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('token')

  return $fetch<T>(url, {
    baseURL: config.public.apiBase,
    headers: {
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...(options.headers || {})
    },
    ...options
  })
}
