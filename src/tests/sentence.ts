import {
    Sentence,
    Meta,
    NominalToken,
    UPOS,
    EmptyToken,
    DepsRelation,
    CompoundToken,
    SentenceValidationResult,
    Feature,
    Relation
} from '../index'
import {
    expect
} from 'chai'
import {
    createReadStream
} from 'fs'
import {
    createInterface
} from 'readline'

describe('Test Sentence', () => {
    describe("Test toString", () => {
        it("Test all type of tokens", () => {
            expect(new Sentence({
                meta: [new Meta({
                    key: "sent_id",
                    value: "1"
                })],
                tokens: [
                    new EmptyToken({
                        form: "hiddenAdj",
                        upos: UPOS.ADJ,
                        deps: [
                            [
                                [1], new DepsRelation("nmod")
                            ]
                        ]
                    }),
                    new EmptyToken({
                        form: "hiddenAdj2",
                        lemma: "hiddenAdj",
                        upos: UPOS.ADJ,
                        feats: [new Feature("Aspect", ["Perf"])],
                        deps: [
                            [
                                [0, 1], new DepsRelation("nmod")
                            ]
                        ]
                    }),
                    new CompoundToken({
                        id: [1, 2],
                        form: "compoundOne"
                    }),
                    new NominalToken({
                        form: "token1",
                        lemma: "token1",
                        upos: UPOS.NOUN
                    }),
                    new EmptyToken({
                        deps: [
                            [
                                [1], new DepsRelation("nsubj")
                            ]
                        ]
                    }),
                    new NominalToken({
                        form: "token2",
                        lemma: "token2",
                        upos: UPOS.VERB
                    }),
                    new EmptyToken({
                        feats: [new Feature("AdvType", ["Man", "Deg"]), new Feature("Aspect", ["Perf"])],
                        deps: [
                            [
                                [2], new DepsRelation("obj")
                            ]
                        ]
                    }),
                ]
            }).toString()).to.eq("# sent_id = 1\u000a0.1\thiddenAdj\t_\tADJ\t_\t_\t_\t_\t1:nmod\t_\u000a0.2\thiddenAdj2\thiddenAdj\tADJ\t_\tAspect=Perf\t_\t_\t0.1:nmod\t_\u000a1-2\tcompoundOne\t_\t_\t_\t_\t_\t_\t_\t_\u000a1\ttoken1\ttoken1\tNOUN\t_\t_\t_\t_\t_\t_\u000a1.1\t_\t_\t_\t_\t_\t_\t_\t1:nsubj\t_\u000a2\ttoken2\ttoken2\tVERB\t_\t_\t_\t_\t_\t_\u000a2.1\t_\t_\t_\t_\tAdvType=Deg,Man|Aspect=Perf\t_\t_\t2:obj\t_")
        })
    })
    describe("Test validate", () => {
        describe("Test valid sequence", () => {
            it("Test empty token", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.equal(SentenceValidationResult.Ok)
            })
            it("Test head/deprel", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            headRel: [2, new Relation("expl")],
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            headRel: [1, new Relation("nsubj")],
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.equal(SentenceValidationResult.Ok)
            })
            it("Test deps", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1, 1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [2, 1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [2], new DepsRelation("obl")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.equal(SentenceValidationResult.Ok)
            })
        })
        describe("Test invalid sequence", () => {
            it("Test invalid empty token after compound token", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [0, 1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.EmptyAfterCompoundError)
            })
            it("Test invalid compound beyond last token", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.CompoundEndBeyondLastTokenError)
            })
            it("Test invalid compound after first token", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.NOUN
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.CompoundStartAfterTokenError)
            })
            it("Test invalid overlap compound token", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new CompoundToken({
                            id: [2, 3],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.NOUN
                        }),
                        new NominalToken({
                            form: "token3",
                            lemma: "token3",
                            upos: UPOS.NOUN
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.CompoundOverlapError)
            })
            it("Test head/deprel", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            headRel: [3, new Relation("expl")],
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            headRel: [1, new Relation("nsubj")],
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.equal(SentenceValidationResult.HeadOutOfBoundError)
            })
            it("Test zero head/deprel", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            headRel: [0, new Relation("expl")],
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.HeadOutOfBoundError)
            })
            it("Test negative head/deprel", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            headRel: [-1, new Relation("expl")],
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.HeadOutOfBoundError)
            })
            it("Test decimal head/deprel", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            headRel: [1.1, new Relation("expl")],
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        })
                    ]
                }).validate()).to.equal(SentenceValidationResult.NonIntegerHeadError)
            })
            it("Test deps with out of bound large head", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [2], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [3], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.equal(SentenceValidationResult.HeadOutOfBoundError)
            })
            it("Test deps with decimal head", () => {
                let sentence = new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1.1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [2], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                })
                expect(sentence.validate.bind(sentence)).to.throw("Head of deps that reference to hidden/empty token must be in [integer, integer] format")
            })
            it("Test deps with out of bound large head value", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1, 2], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [2], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.eq(SentenceValidationResult.DepHeadOutOfBoundError)
            })
            it("Test deps with zero head value", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1, 0], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [2], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.eq(SentenceValidationResult.DepHeadOutOfBoundError)
            })
            it("Test deps with negative head value", () => {
                expect(new Sentence({
                    meta: [new Meta({
                        key: "sent_id",
                        value: "1"
                    })],
                    tokens: [
                        new EmptyToken({
                            deps: [
                                [
                                    [1, -1], new DepsRelation("nmod")
                                ]
                            ]
                        }),
                        new CompoundToken({
                            id: [1, 2],
                            form: "compoundOne"
                        }),
                        new NominalToken({
                            form: "token1",
                            lemma: "token1",
                            upos: UPOS.NOUN
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [1], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                        new NominalToken({
                            form: "token2",
                            lemma: "token2",
                            upos: UPOS.VERB
                        }),
                        new EmptyToken({
                            deps: [
                                [
                                    [2], new DepsRelation("nsubj")
                                ]
                            ]
                        }),
                    ]
                }).validate()).to.eq(SentenceValidationResult.DepHeadOutOfBoundError)
            })
        })
    })
    describe("Test parse", () => {
        it("test parse a sentence", async () => {
            const stream = createReadStream(process.cwd() + '/src/tests/thai.conllu')
            const lineIf = createInterface({
                input: stream,
                crlfDelay: Infinity
            })
            let sentenceStr = ""
            // parse only first sentence
            for await (const line of lineIf) {
                if (line.trim().length > 0) {
                    sentenceStr += line + "\u000a"
                } else {
                    break
                }
            }
            lineIf.close()
            stream.close()
            let sentence = await Sentence.parse(sentenceStr)
            expect(sentence).to.eql(
                new Sentence({
                    meta: [
                        new Meta({
                            key: 'sent_id',
                            value: 'n01001011'
                        }),
                        new Meta({
                            key: 'text',
                            value: '“แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์'
                        }),
                        new Meta({
                            key: 'text_en',
                            value: '“While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday.'
                        })
                    ],
                    tokens: [
                        new NominalToken({
                            form: '“',
                            lemma: undefined,
                            upos: UPOS.PUNCT,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("punct")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'แม้',
                            lemma: undefined,
                            upos: UPOS.ADP,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [10, new Relation("mark")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ว่า',
                            lemma: undefined,
                            upos: UPOS.ADP,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [2, new Relation("fixed")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'การเปลี่ยน',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [10, new Relation("csubj")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ไป',
                            lemma: undefined,
                            upos: UPOS.PART,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [4, new Relation("compound:prt")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ใช้',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [4, new Relation("xcomp")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ระบบ',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [6, new Relation("obj")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ดิจิตัล',
                            lemma: undefined,
                            upos: UPOS.ADJ,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [7, new Relation("amod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'เป็น',
                            lemma: undefined,
                            upos: UPOS.AUX,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [10, new Relation("cop")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'สิ่ง',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("advcl")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ที่',
                            lemma: undefined,
                            upos: UPOS.DET,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [14, new Relation("nsubj")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ไม่',
                            lemma: undefined,
                            upos: UPOS.PART,
                            xpos: undefined,
                            feats: [new Feature("Polarity", ["Neg"])],
                            headRel: [13, new Relation("advmod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'เคย',
                            lemma: undefined,
                            upos: UPOS.PART,
                            xpos: undefined,
                            feats: [new Feature("Aspect", ["Perf"])],
                            headRel: [14, new Relation("aux")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'มี',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [10, new Relation("acl:relcl")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'มา',
                            lemma: undefined,
                            upos: UPOS.PART,
                            xpos: undefined,
                            feats: [new Feature("Aspect", ["Perf"])],
                            headRel: [14, new Relation("aux")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ก่อน',
                            lemma: undefined,
                            upos: UPOS.ADV,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [14, new Relation("advmod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ใน',
                            lemma: undefined,
                            upos: UPOS.ADP,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [18, new Relation("case")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'สหรัฐ',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [14, new Relation("obl")],
                            deps: undefined,
                            misc: ["Proper=True", "SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ฯ',
                            lemma: undefined,
                            upos: UPOS.PUNCT,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [18, new Relation("punct")],
                            deps: undefined,
                            misc: ["Proper=True"]
                        }),
                        new NominalToken({
                            form: 'การเปลี่ยนผ่าน',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("csubj")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'อำนาจ',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [20, new Relation("obj")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'อย่างสันติ',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [20, new Relation("advmod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'นั้น',
                            lemma: undefined,
                            upos: UPOS.DET,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [20, new Relation("det")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ก็',
                            lemma: undefined,
                            upos: UPOS.ADV,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("advmod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ไม่',
                            lemma: undefined,
                            upos: UPOS.PART,
                            xpos: undefined,
                            feats: [new Feature("Polarity", ["Neg"])],
                            headRel: [27, new Relation("advmod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ใช่',
                            lemma: undefined,
                            upos: UPOS.AUX,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("cop")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'เรื่อง',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [37, new Relation("ccomp")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ใหม่',
                            lemma: undefined,
                            upos: UPOS.ADJ,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("amod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: '”',
                            lemma: undefined,
                            upos: UPOS.PUNCT,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [27, new Relation("punct")],
                            deps: undefined,
                            misc: undefined
                        }),
                        new NominalToken({
                            form: 'โคริ',
                            lemma: undefined,
                            upos: UPOS.PROPN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [37, new Relation("nsubj")],
                            deps: undefined,
                            misc: undefined
                        }),
                        new NominalToken({
                            form: 'ชูลแมน',
                            lemma: undefined,
                            upos: UPOS.PROPN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [30, new Relation("flat:name")],
                            deps: undefined,
                            misc: undefined
                        }),
                        new NominalToken({
                            form: 'ผู้',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [30, new Relation("appos")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ช่วย',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [32, new Relation("acl")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'พิเศษ',
                            lemma: undefined,
                            upos: UPOS.ADJ,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [32, new Relation("amod")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ของ',
                            lemma: undefined,
                            upos: UPOS.ADP,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [36, new Relation("case")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'โอบามา',
                            lemma: undefined,
                            upos: UPOS.PROPN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [32, new Relation("nmod:poss")],
                            deps: undefined,
                            misc: undefined
                        }),
                        new NominalToken({
                            form: 'เขียน',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [0, new Relation("root")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'ลง',
                            lemma: undefined,
                            upos: UPOS.VERB,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [37, new Relation("xcomp")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'บล็อก',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [38, new Relation("obj")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'เมื่อ',
                            lemma: undefined,
                            upos: UPOS.ADP,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [41, new Relation("case")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'วัน',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [37, new Relation("obl")],
                            deps: undefined,
                            misc: ["SpaceAfter=No"]
                        }),
                        new NominalToken({
                            form: 'จันทร์',
                            lemma: undefined,
                            upos: UPOS.NOUN,
                            xpos: undefined,
                            feats: undefined,
                            headRel: [41, new Relation("appos")],
                            deps: undefined,
                            misc: undefined
                        })
                    ]
                })
            )
        })
        // TODO More test cases for parse setence go here
    })
})