import { useCallback, useState } from 'react'
import { loadSupplierState, saveSupplierState, SUPPLIERS } from '../data/suppliers'

function persist(next) {
  saveSupplierState(next)
  return next
}

export function useSuppliers() {
  const [state, setState] = useState(loadSupplierState)

  const suppliers = SUPPLIERS.map((supplier) => ({
    ...supplier,
    currentOrders: supplier.currentOrders + (state.extraOrders[supplier.id] || 0),
    history: [...(state.extraHistory[supplier.id] || []), ...supplier.history],
  }))

  const joinOrder = useCallback((supplierId, qty) => {
    const amount = Math.max(Number(qty) || 1, 1)
    setState((current) =>
      persist({
        ...current,
        extraOrders: {
          ...current.extraOrders,
          [supplierId]: (current.extraOrders[supplierId] || 0) + amount,
        },
        extraHistory: {
          ...current.extraHistory,
          [supplierId]: [
            {
              id: `join-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              item: `Group buy commitment × ${amount}`,
              amount: 0,
              status: 'Processing',
            },
            ...(current.extraHistory[supplierId] || []),
          ],
        },
      }),
    )
  }, [])

  const requestStock = useCallback((supplierId, payload) => {
    const request = {
      id: `req-${Date.now()}`,
      supplierId,
      ...payload,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    }
    setState((current) =>
      persist({
        ...current,
        requests: [request, ...current.requests],
        extraHistory: {
          ...current.extraHistory,
          [supplierId]: [
            {
              id: request.id,
              date: request.createdAt.slice(0, 10),
              item: `${payload.item} × ${payload.qty}`,
              amount: payload.amount || 0,
              status: 'Pending',
            },
            ...(current.extraHistory[supplierId] || []),
          ],
        },
      }),
    )
    return request
  }, [])

  const sendMessage = useCallback((supplierId, payload) => {
    const message = {
      id: `msg-${Date.now()}`,
      supplierId,
      ...payload,
      createdAt: new Date().toISOString(),
    }
    setState((current) => persist({ ...current, messages: [message, ...current.messages] }))
    return message
  }, [])

  const addNeed = useCallback((payload) => {
    const need = { id: `need-${Date.now()}`, ...payload, createdAt: new Date().toISOString() }
    setState((current) => persist({ ...current, needs: [need, ...current.needs] }))
    return need
  }, [])

  return { suppliers, requests: state.requests, messages: state.messages, needs: state.needs, joinOrder, requestStock, sendMessage, addNeed }
}
