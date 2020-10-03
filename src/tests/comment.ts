import {CompoundToken, Comment} from '../index'
import {expect} from 'chai'

describe("Test Comment", () => {
    describe("Test toString", () => {
        it("Test standard comment", () => {
            expect(new Comment("abc").toString()).to.equals("# abc")
        })
        it("Test empty comment", () => {
            expect(new Comment().toString()).to.equals("#")
        })
        it("Test empty comment", () => {
            expect(new Comment("    ").toString()).to.equals("#")
        })
    })
    describe("Test parsing", () => {
        it("Test parse standard comment", () => {
            expect(Comment.parse("# abc")).to.eql(new Comment("abc"))
        })
        it("Test parse empty comment", () => {
            expect(Comment.parse("#")).to.eql(new Comment())
        })
        it("Test parse comment with only whitespace", () => {
            expect(Comment.parse("#  ")).to.eql(new Comment())
        })
    })
})