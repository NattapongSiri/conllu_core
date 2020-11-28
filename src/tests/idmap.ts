import { expect } from "chai"
import { TokenIdMap, TokenType } from ".."

describe("Test TokenIdMap", () => {
    describe("Test insert", () => {
        let map = new TokenIdMap()
        beforeEach(() => {
            for (let i = 0; i < 10; i++) {
                map.push(i + 1)
            }
            map.splice(map.length - 1, 0, [9, 1], [9, 2])
        })
        afterEach(() => {
            map.length = 0
        })
        it("Test insert element between empty element", () => {
            map.insert(10, TokenType.Nominal)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], 10, [10, 1], 11])
        })
        it("Test insert empty element after empty element", () => {
            map.insert(11, TokenType.Empty)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], [9, 3], 10])
        })
        it("Test insert 2 elements between empty element", () => {
            map.insert(10, TokenType.Nominal, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], 10, 11, [11, 1], 12])
        })
        it("Test insert empty element between empty element", () => {
            map.insert(10, TokenType.Empty)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], [9, 3], 10])
        })
        it("Test insert 2 empty elements between empty element", () => {
            map.insert(10, TokenType.Empty, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], [9, 3], [9, 4], 10])
        })
        it("Test insert element after empty element", () => {
            map.insert(11, TokenType.Nominal)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10, 11])
        })
        it("Test insert 2 elements after empty element", () => {
            map.insert(11, TokenType.Nominal, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10, 11, 12])
        })
        it("Test insert element at the middle", () => {
            map.insert(5, TokenType.Nominal)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, [10, 1], [10, 2], 11])
        })
        it("Test insert 2 elements at the middle", () => {
            map.insert(5, TokenType.Nominal, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, [11, 1], [11, 2], 12])
        })
        it("Test insert empty element at the middle", () => {
            map.insert(5, TokenType.Empty)
            expect(map).to.eql([1, 2, 3, 4, 5, [5, 1], 6, 7, 8, 9, [9, 1], [9, 2], 10])
        })
        it("Test insert 2 empty elements at the middle", () => {
            map.insert(5, TokenType.Empty, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, [5, 1], [5, 2], 6, 7, 8, 9, [9, 1], [9, 2], 10])
        })
        it("Test insert element at the end", () => {
            map.insert(map.length, TokenType.Nominal)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10, 11])
        })
        it("Test insert 2 elements at the end", () => {
            map.insert(map.length, TokenType.Nominal, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10, 11, 12])
        })
        it("Test insert empty element at the end", () => {
            map.insert(map.length, TokenType.Empty)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10, [10, 1]])
        })
        it("Test insert 2 empty elements at the end", () => {
            map.insert(map.length, TokenType.Empty, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10, [10, 1], [10, 2]])
        })
        it("Test insert element at the front", () => {
            map.insert(0, TokenType.Nominal)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, [10, 1], [10, 2], 11])
        })
        it("Test insert 2 elements at the front", () => {
            map.insert(0, TokenType.Nominal, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, [11, 1], [11, 2], 12])
        })
        it("Test insert empty element at the front", () => {
            map.insert(0, TokenType.Empty)
            expect(map).to.eql([[0, 1], 1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10])
        })
        it("Test insert 2 empty elements at the front", () => {
            map.insert(0, TokenType.Empty, 2)
            expect(map).to.eql([[0, 1], [0, 2], 1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2], 10])
        })
        it("Test insert element cause out of bound", () => {
            expect(map.insert.bind(map, map.length + 1, TokenType.Nominal)).to.throw("Index out of bound")
        })
    })
    describe("Test remove_chunk", () => {
        let map = new TokenIdMap()
        beforeEach(() => {
            for (let i = 0; i < 10; i++) {
                map.push(i + 1)
            }
            map.splice(map.length - 1, 0, [9, 1], [9, 2])
        })
        afterEach(() => {
            map.length = 0
        })
        it("Test remove middle element", () => {
            map.remove_chunk(5)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, [8, 1], [8, 2], 9])
        })
        it("Test remove 2 middle elements", () => {
            map.remove_chunk(4, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, [7, 1], [7, 2], 8])
        })
        it("Test remove 1 first element", () => {
            map.remove_chunk(0)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, [8, 1], [8, 2], 9])
        })
        it("Test remove 2 first elements", () => {
            map.remove_chunk(0, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, [7, 1], [7, 2], 8])
        })
        it("Test remove 1 last element", () => {
            map.remove_chunk(map.length - 1)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1], [9, 2]])
        })
        it("Test remove 2 last elements", () => {
            map.remove_chunk(map.length - 2, 2)
            expect(map).to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, [9, 1]])
        })
        it("Test remove beyond last element", () => {
            expect(map.remove_chunk.bind(map, map.length - 1, 2)).to.throw("Index out of bound")
        })
    })
})