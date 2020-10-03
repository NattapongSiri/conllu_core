import {NominalToken, UPOS, XPOS, Feature, DepsRelation, Relation} from '../index'
import {expect} from 'chai'

describe("Test NominalToken", () => {

    describe("Test toString", () => {
        it("Test minimal NominalToken", () => {
            let token = new NominalToken({form: "token", lemma: "_", upos: UPOS.NOUN})
            expect(token.toString()).to.equal("token\t_\tNOUN\t_\t_\t_\t_\t_\t_")
        })
        it("Test xpos of NominalToken", () => {
            class BinVerbTH implements XPOS {
                public toUPOS(): UPOS {
                    return UPOS.VERB
                }
                public toString(): string {
                    return "Vb.Bin"
                }
            }
            let token = new NominalToken({form: "token", lemma: "tok", upos: UPOS.VERB, xpos: new BinVerbTH()})
            expect(token.toString()).to.equal("token\ttok\tVERB\tVb.Bin\t_\t_\t_\t_\t_")
        })
        it("Test feats of NominalToken", () => {
            let token = new NominalToken({form: "token", lemma: "tok", upos: UPOS.VERB, feats: [new Feature("Aspect", ["Imp"]), new Feature("AdvType", ["Man", "Cau"])]})
            expect(token.toString()).to.equal("token\ttok\tVERB\t_\tAdvType=Cau,Man|Aspect=Imp\t_\t_\t_\t_")
        })
        it("Test head/deprel of NominalToken", () => {
            let token = new NominalToken({form: "token", lemma: "tok", upos: UPOS.VERB, headRel: [1, new Relation("obl")]})
            expect(token.toString()).to.equal("token\ttok\tVERB\t_\t_\t1\tobl\t_\t_")
        })
        it("Test deps of NominalToken", () => {
            let token = new NominalToken({form: "token", lemma: "tok", upos: UPOS.VERB, deps: [[[2], new DepsRelation("obl")], [[1], new DepsRelation("obl")]]})
            expect(token.toString()).to.equal("token\ttok\tVERB\t_\t_\t_\t_\t1:obl|2:obl\t_")
        })
        it("Test misc of NominalToken", () => {
            let token = new NominalToken({form: "token", lemma: "tok", upos: UPOS.VERB, misc: ["PhraseLv=1", "SpaceAfter=Yes"]})
            expect(token.toString()).to.equal("token\ttok\tVERB\t_\t_\t_\t_\t_\tPhraseLv=1|SpaceAfter=Yes")
        })
    })
    
    describe("Test parsing", () => {
        class ThaiAdverb implements XPOS {
            pos: string
    
            static parse(str: string): ThaiAdverb {
                let pos = new ThaiAdverb()
                if (!str.startsWith("Adv")) {
                    throw "Thai verb must start with Adv"
                }
                pos.pos = str
    
                return pos
            }
    
            constructor(str?: string) {
                this.pos = str
            }
    
            toUPOS(): UPOS {
                return UPOS.ADV
            }
    
            toString(): string {
                return this.pos
            }
        }
        describe("Test valid string", () => {
            it("Test parse full token", () => {
                expect(NominalToken.parse("1\tToken\tToken\tADV\tAdv.Temp\tAdvType=Cau,Man|Aspect=Imp\t1\tobl\t1:obl|2:obl\tPhraseLv=1|SpaceAfter=Yes", ThaiAdverb))
                    .to.eql([1, new NominalToken({
                        form: "Token", 
                        lemma: "Token", 
                        upos: UPOS.ADV, 
                        xpos: new ThaiAdverb("Adv.Temp"), 
                        feats: [new Feature("AdvType", ["Cau", "Man"]), new Feature("Aspect", ["Imp"])],
                        headRel: [1, new Relation("obl")],
                        deps: [[[1], new DepsRelation("obl")], [[2], new DepsRelation("obl")]],
                        misc: ["PhraseLv=1", "SpaceAfter=Yes"]
                    })])
            })
            it("Test parse partially empty token", () => {
                expect(NominalToken.parse("1\tToken\tToken\tADV\tAdv.Temp\tAdvType=Cau\t1\tobl\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.eql([1, new NominalToken({
                        form: "Token", 
                        lemma: "Token", 
                        upos: UPOS.ADV, 
                        xpos: new ThaiAdverb("Adv.Temp"), 
                        feats: [new Feature("AdvType", ["Cau"])],
                        headRel: [1, new Relation("obl")],
                        misc: ["SpaceAfter=No"]
                    })])
            })
            it("Test parse Thai deps value", () => {
                expect(NominalToken.parse("1\tToken\tToken\tADV\tAdv.Temp\t_\t_\t_\t1:aaa:thai:นิยม\tSpaceAfter=No", ThaiAdverb))
                    .to.eql([1, new NominalToken({
                        form: "Token", 
                        lemma: "Token", 
                        upos: UPOS.ADV, 
                        xpos: new ThaiAdverb("Adv.Temp"), 
                        deps: [[[1], new DepsRelation("aaa:thai:นิยม")]],
                        misc: ["SpaceAfter=No"]
                    })])
            })
            it("Test parse minimum token", () => {
                expect(NominalToken.parse("1\tToken\tToken\tADV\t_\t_\t_\t_\t_\t_"))
                    .to.eql([1, new NominalToken({
                        form: "Token", 
                        lemma: "Token", 
                        upos: UPOS.ADV
                    })])
            })
            it("Test parse dep on null token", () => {
                expect(NominalToken.parse("1\tToken\tToken\tADV\t_\t_\t_\t_\t2.2:nsubj\t_"))
                    .to.eql([1, new NominalToken({
                        form: "Token", 
                        lemma: "Token", 
                        upos: UPOS.ADV,
                        deps: [[[2, 2], new DepsRelation("nsubj")]]
                    })])
            })
        })
        describe("Test invalid string", () => {
            it("Test parse invalid feature name token", () => {
                expect(NominalToken.parse.bind(NominalToken, "1\tToken\tToken\tADV\tAdv.Temp\t!!!=Cau\t1\tobl\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("Feature name must match with this regex: [A-Z0-9][A-Z0-9a-z]*(\\[[a-z0-9]+\\])?")
            })
            it("Test parse id of null token", () => {
                expect(NominalToken.parse.bind(NominalToken, "1.1\tToken\tToken\tADV\tAdv.Temp\t_\t_\tobl\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("The give string is not valid Nominal token")
            })
            it("Test parse invalid id token", () => {
                expect(NominalToken.parse.bind(NominalToken, "1abcd\tToken\tToken\tADV\tAdv.Temp\t_\t_\tobl\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("The give string is not valid Nominal token")
            })
            it("Test parse invalid feature value token", () => {
                expect(NominalToken.parse.bind(NominalToken, "1\tToken\tToken\tADV\tAdv.Temp\tAdvType=???\t1\tobl\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("All feature value must match with this regex: [A-Z0-9][a-zA-Z0-9]*")
            })
            it("Test parse invalid 3 sections deprel", () => {
                expect(NominalToken.parse.bind(NominalToken, "1\tToken\tToken\tADV\tAdv.Temp\t_\t1\tobl:abc:def\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("`deprel` field must match following regex: ^[a-z]+(:[a-z]+)?$")
            })
            it("Test parse invalid chars deprel", () => {
                expect(NominalToken.parse.bind(NominalToken, "1\tToken\tToken\tADV\tAdv.Temp\t_\t1\tAbc\t_\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("`deprel` field must match following regex: ^[a-z]+(:[a-z]+)?$")
            })
            it("Test parse invalid deps", () => {
                expect(NominalToken.parse.bind(NominalToken, "1\tToken\tToken\tADV\tAdv.Temp\t_\t_\t_\t1:\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("Relation value in `deps` field must match this regex: ^[a-z]+(:[a-z]+)?(:[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+(_[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+)*)?(:[a-z]+)?$")
            })
            it("Test parse invalid chars deps", () => {
                expect(NominalToken.parse.bind(NominalToken, "1\tToken\tToken\tADV\tAdv.Temp\t_\t_\t_\t1:Aaa\tSpaceAfter=No", ThaiAdverb))
                    .to.throw("Relation value in `deps` field must match this regex: ^[a-z]+(:[a-z]+)?(:[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+(_[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+)*)?(:[a-z]+)?$")
            })
        })
    })
})