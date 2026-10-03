import { useState } from 'react'
import { validate } from '@roxiler/shared'

export function useForm(initial, { fields = [], ruleFor, onSubmit }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  const bind = (name) => ({
    id: name,
    name,
    value: values[name],
    error: errors[name],
    onChange: (e) => set(name, e.target.value),
  })

  async function handleSubmit(e) {
    e.preventDefault()
    const { errors: found } = validate(values, fields, ruleFor)
    if (found) return setErrors(found)

    setErrors({})
    setBusy(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setErrors(Object.keys(err.errors ?? {}).length ? err.errors : { form: err.message })
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setValues(initial)
    setErrors({})
  }

  return { values, set, errors, busy, bind, handleSubmit, reset }
}
