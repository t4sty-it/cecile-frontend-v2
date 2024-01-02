import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import ReactReconciler from 'react-reconciler'

const reconciler = ReactReconciler({
  supportsMutation: true,
  supportsPersistence: false,
  createInstance: function (type: unknown, props: unknown, rootContainer: unknown, hostContext: unknown, internalHandle: any): unknown {
    throw new Error('Function not implemented.')
  },
  createTextInstance: function (text: string, rootContainer: unknown, hostContext: unknown, internalHandle: any): unknown {
    throw new Error('Function not implemented.')
  },
  appendInitialChild: function (parentInstance: unknown, child: unknown): void {
    throw new Error('Function not implemented.')
  },
  finalizeInitialChildren: function (instance: unknown, type: unknown, props: unknown, rootContainer: unknown, hostContext: unknown): boolean {
    throw new Error('Function not implemented.')
  },
  prepareUpdate: function (instance: unknown, type: unknown, oldProps: unknown, newProps: unknown, rootContainer: unknown, hostContext: unknown): unknown {
    throw new Error('Function not implemented.')
  },
  shouldSetTextContent: function (type: unknown, props: unknown): boolean {
    throw new Error('Function not implemented.')
  },
  getRootHostContext: function (rootContainer: unknown): unknown {
    throw new Error('Function not implemented.')
  },
  getChildHostContext: function (parentHostContext: unknown, type: unknown, rootContainer: unknown): unknown {
    throw new Error('Function not implemented.')
  },
  getPublicInstance: function (instance: unknown): unknown {
    throw new Error('Function not implemented.')
  },
  prepareForCommit: function (containerInfo: unknown): Record<string, any> | null {
    throw new Error('Function not implemented.')
  },
  resetAfterCommit: function (containerInfo: unknown): void {
    throw new Error('Function not implemented.')
  },
  preparePortalMount: function (containerInfo: unknown): void {
    throw new Error('Function not implemented.')
  },
  scheduleTimeout: function (fn: (...args: unknown[]) => unknown, delay?: number | undefined): unknown {
    throw new Error('Function not implemented.')
  },
  cancelTimeout: function (id: unknown): void {
    throw new Error('Function not implemented.')
  },
  noTimeout: undefined,
  isPrimaryRenderer: false,
  getCurrentEventPriority: function (): number {
    throw new Error('Function not implemented.')
  },
  getInstanceFromNode: function (node: any): ReactReconciler.Fiber | null | undefined {
    throw new Error('Function not implemented.')
  },
  beforeActiveInstanceBlur: function (): void {
    throw new Error('Function not implemented.')
  },
  afterActiveInstanceBlur: function (): void {
    throw new Error('Function not implemented.')
  },
  prepareScopeUpdate: function (scopeInstance: any, instance: any): void {
    throw new Error('Function not implemented.')
  },
  getInstanceFromScope: function (scopeInstance: any): unknown {
    throw new Error('Function not implemented.')
  },
  detachDeletedInstance: function (node: unknown): void {
    throw new Error('Function not implemented.')
  },
  supportsHydration: false
})