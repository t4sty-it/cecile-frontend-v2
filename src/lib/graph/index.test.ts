import { test, expect } from 'bun:test'
import { graphOf, union } from '.'
import { length } from '../set'

test('graph union', () => {
  const g1 = graphOf(
    [ {id: '1'} ],
    [ {id: '2', parentId: '1'} ],
    [ {id: 'x', src: '1', dst: '2'} ]
  )

  const g2 = graphOf(
    [ {id: '3'} ],
    [ {id: '4', parentId: '3'}],
    [ {id: 'y', src: '1', dst: '2'} ]
  )

  const g1g2 = union(g1, g2)

  expect(length(g1g2.nodes)).toBe(2)
  expect(length(g1g2.params)).toBe(2)
  expect(length(g1g2.edges)).toBe(2)
})