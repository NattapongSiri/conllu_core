import {Meta} from '../index'
import {expect} from 'chai'

describe("Test Meta", () => {
    describe("Test parsing", () => {
        it("test parse meta key/value with space around `=`", () => {
            expect(Meta.parse("# sent_id = 1234"))
                .to.eql(new Meta({key: "sent_id", value: "1234"}))
        })
        it("test parse meta key/value without space around `=`", () => {
            expect(Meta.parse("# sent_id=1234"))
                .to.eql(new Meta({key: "sent_id", value: "1234"}))
        })
        it("test parse meta key/value with `#` in key", () => {
            expect(Meta.parse("##sent_id=1234"))
                .to.eql(new Meta({key: "#sent_id", value: "1234"}))
        })
        it("test parse meta key/value with `#` in value", () => {
            expect(Meta.parse("# sent_id=#1234"))
                .to.eql(new Meta({key: "sent_id", value: "#1234"}))
        })
        it("test parse comment as meta", () => {
            expect(Meta.parse.bind(Meta, "# sent_id1234"))
                .to.throw("Meta entry must have `=` symbol")
                
        })
        it("test parse plain string as meta", () => {
            expect(Meta.parse.bind(Meta, "sent_id1234"))
                .to.throw("Meta entry must start with `#`")
                
        })
    })
    describe("Test toString", () => {
        it("Test no value", () => {
            expect(new Meta({key:"v"}).toString()).to.eq("# v")
        })
        it("Test no key", () => {
            expect(() => {
                let m = new Meta({key: "k", value: "v"})
                m.key = undefined
                return m.toString()
            }).to.throw("Missing key from meta")
        })
        it("Test key/value", () => {
            expect(new Meta({key: "k", value: "v"}).toString()).to.eql("# k = v")
        })
        it("Test # in key", () => {
            expect(new Meta({key: "#k", value: "v"}).toString()).to.eql("# #k = v")
        })
        it("Test # in value", () => {
            expect(new Meta({key: "k", value: "#v"}).toString()).to.eql("# k = #v")
        })
    })
})