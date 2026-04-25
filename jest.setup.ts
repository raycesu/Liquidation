import "@testing-library/jest-dom"
import { TextDecoder, TextEncoder } from "node:util"

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.assign(globalThis, {
  ResizeObserver: ResizeObserverMock,
})
