import {EmptyToken, DepsRelation, UPOS, XPOS, Feature} from '../index'
import {expect} from 'chai'

class ThaiVerb implements XPOS {
    pos: string

    static parse(str: string): ThaiVerb {
        let pos = new ThaiVerb()
        if (!str.startsWith("Vb")) {
            throw "Thai verb must start with Adv"
        }
        pos.pos = str

        return pos
    }

    constructor(str?: string) {
        this.pos = str
    }

    toUPOS(): UPOS {
        return UPOS.VERB
    }

    toString(): string {
        return this.pos
    }
}

describe("Test EmptyToken", () => {
    describe("Test toString", () => {
        it("Test minimal EmptyToken", () => {
            let token = new EmptyToken({deps: [[[0], new DepsRelation("aaa")]]})
            expect(token.toString()).to.equal("_\t_\t_\t_\t_\t_\t_\t0:aaa\t_")
        })
        it("Test EmptyToken", () => {
            let token = new EmptyToken({form: "token", lemma: "token", upos: UPOS.VERB, xpos: new ThaiVerb("Vb.Trans"), feats: [new Feature("Aspect", ["Imp"]), new Feature("AdvType", ["Man", "Cau"])], deps: [[[0], new DepsRelation("aaa")]], misc: ["SpaceAfter=Yes", "PhraseLv=2"]})
            expect(token.toString()).to.equals("token\ttoken\tVERB\tVb.Trans\tAdvType=Cau,Man|Aspect=Imp\t_\t_\t0:aaa\tSpaceAfter=Yes|PhraseLv=2")
        })
    })
    
    describe("Test parsing", () => {
        describe("Test valid string", () => {
            it("Test parse full token", () => {
                expect(EmptyToken.parse("1.2\tToken\t_\t_\t_\t_\t_\t_\t1:nsubj\tPhraseLv=1|SpaceAfter=Yes", ThaiVerb))
                    .to.eql([1, 2, new EmptyToken({
                        form: "Token", 
                        deps: [[[1], new DepsRelation("nsubj")]],
                        misc: ["PhraseLv=1", "SpaceAfter=Yes"]
                    })])
            })
            it("Test parse full token", () => {
                expect(EmptyToken.parse("1.2\tToken\t_\t_\t_\t_\t_\t_\t1:nsubj\tPhraseLv=1|SpaceAfter=Yes", ThaiVerb))
                    .to.eql([1, 2, new EmptyToken({
                        form: "Token", 
                        deps: [[[1], new DepsRelation("nsubj")]],
                        misc: ["PhraseLv=1", "SpaceAfter=Yes"]
                    })])
            })
            it("Test parse ref to other null token", () => {
                expect(EmptyToken.parse("1.2\tToken\t_\t_\t_\t_\t_\t_\t1.3:nsubj\tPhraseLv=1|SpaceAfter=Yes", ThaiVerb))
                    .to.eql([1, 2, new EmptyToken({
                        form: "Token", 
                        deps: [[[1, 3], new DepsRelation("nsubj")]],
                        misc: ["PhraseLv=1", "SpaceAfter=Yes"]
                    })])
            })
        })
        describe("Test invalid string", () => {
            it("Test parse empty token by using nominal token", () => {
                expect(EmptyToken.parse.bind(EmptyToken, "1\tToken\tADV\t_\t_\t_\t_\t_\t2:nsubj\t_"))
                    .to.throw("ID of empty token must be in format `int.int`")
            })
            it("Test parse bad empty token string id", () => {
                expect(EmptyToken.parse.bind(EmptyToken, "1.1.1\tToken\tADV\t_\t_\t_\t_\t_\t2:nsubj\t_"))
                    .to.throw("ID of empty token must be in format `int.int`")
            })
            it("Test parse bad deps token string id", () => {
                expect(EmptyToken.parse.bind(EmptyToken, "1.1\tToken\tADV\t_\t_\t_\t_\t_\t2.:nsubj\t_"))
                    .to.throw("Deps contain non-numeric null node position")
            })
            it("Test parse bad deps token string id", () => {
                expect(EmptyToken.parse.bind(EmptyToken, "1.1\tToken\tADV\t_\t_\t_\t_\t_\t2.2.2:nsubj\t_"))
                    .to.throw("ID of Deps must be either `int` or `int`.`int`")
            })
        })
    })
})