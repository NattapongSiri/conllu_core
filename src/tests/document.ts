import { expect } from 'chai'
import {createReadStream} from 'fs'
import {
    createInterface
} from 'readline'
import {Readable, Writable} from 'stream'
import { Document, SentenceValidationResult } from '..'

describe("Test Document", () => {
    describe("Test parse", () => {
        it("test parse sentences", async () => {
            const stream = createReadStream(process.cwd() + '/src/tests/docs.conllu')
            const lineIf = createInterface({
                input: stream,
                crlfDelay: Infinity
            })
            let sentenceStr = ""
            for await (const line of lineIf) {
                sentenceStr += line + "\u000a"
            }
            let doc = await Document.parse(sentenceStr)
            expect(JSON.stringify(doc, null, 4)).to.eql(JSON.stringify({
                "sentences": [
                    {
                        "meta": [
                            {
                                "key": "sent_id",
                                "value": "n01001011"
                            },
                            {
                                "key": "text",
                                "value": "“แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์"
                            },
                            {
                                "key": "text_en",
                                "value": "“While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday."
                            },
                            {
                                "text": "Just a comment"
                            }
                        ],
                        "tokens": [
                            {
                                "form": "“",
                                "upos": "PUNCT",
                                "head": 27,
                                "deprel": {
                                    "rel": "punct"
                                },
                                "misc": [
                                    "SpaceAfter=No"
                                ]
                            },
                            {
                                "form": "แม้",
                                "upos": "ADP",
                                "head": 10,
                                "deprel": {
                                    "rel": "mark"
                                },
                                "misc": [
                                    "SpaceAfter=No"
                                ]
                            }
                        ]
                    },
                    {
                        "meta": [
                            {
                                "key": "sent_id",
                                "value": "n01001013"
                            },
                            {
                                "key": "text",
                                "value": "สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย"
                            },
                            {
                                "key": "text_en",
                                "value": "For those who follow social media transitions on Capitol Hill, this will be a little different."
                            }
                        ],
                        "tokens": [
                            {
                                "form": "สำหรับ",
                                "upos": "ADP",
                                "head": 2,
                                "deprel": {
                                    "rel": "case"
                                },
                                "misc": [
                                    "SpaceAfter=No"
                                ]
                            },
                            {
                                "form": "ผู้",
                                "upos": "NOUN",
                                "head": 13,
                                "deprel": {
                                    "rel": "obl"
                                },
                                "misc": [
                                    "SpaceAfter=No"
                                ]
                            }
                        ]
                    }
                ]
            }, null, 4))
        })
        it("test parse and validate sentence str", async () => {
            const stream = createReadStream(process.cwd() + '/src/tests/docs.conllu')
            const lineIf = createInterface({
                input: stream,
                crlfDelay: Infinity
            })
            let sentenceStr = ""
            for await (const line of lineIf) {
                sentenceStr += line + "\u000a"
            }
            let doc = await Document.parse(sentenceStr)
            expect(doc.validate()).to.eq(SentenceValidationResult.HeadOutOfBoundError)
        })
    })
    it("test load conllu file", async () => {
        let doc = await Document.load(process.cwd() + '/src/tests/docs.conllu')
        expect(JSON.stringify(doc, null, 4)).to.eql(JSON.stringify({
            "sentences": [
                {
                    "meta": [
                        {
                            "key": "sent_id",
                            "value": "n01001011"
                        },
                        {
                            "key": "text",
                            "value": "“แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์"
                        },
                        {
                            "key": "text_en",
                            "value": "“While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday."
                        },
                        {
                            "text": "Just a comment"
                        }
                    ],
                    "tokens": [
                        {
                            "form": "“",
                            "upos": "PUNCT",
                            "head": 27,
                            "deprel": {
                                "rel": "punct"
                            },
                            "misc": [
                                "SpaceAfter=No"
                            ]
                        },
                        {
                            "form": "แม้",
                            "upos": "ADP",
                            "head": 10,
                            "deprel": {
                                "rel": "mark"
                            },
                            "misc": [
                                "SpaceAfter=No"
                            ]
                        }
                    ]
                },
                {
                    "meta": [
                        {
                            "key": "sent_id",
                            "value": "n01001013"
                        },
                        {
                            "key": "text",
                            "value": "สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย"
                        },
                        {
                            "key": "text_en",
                            "value": "For those who follow social media transitions on Capitol Hill, this will be a little different."
                        }
                    ],
                    "tokens": [
                        {
                            "form": "สำหรับ",
                            "upos": "ADP",
                            "head": 2,
                            "deprel": {
                                "rel": "case"
                            },
                            "misc": [
                                "SpaceAfter=No"
                            ]
                        },
                        {
                            "form": "ผู้",
                            "upos": "NOUN",
                            "head": 13,
                            "deprel": {
                                "rel": "obl"
                            },
                            "misc": [
                                "SpaceAfter=No"
                            ]
                        }
                    ]
                }
            ]
        }, null, 4))
    })
    it("test load conllu file and convert back to conllu", async () => {
        let doc = await Document.load(process.cwd() + '/src/tests/docs.conllu')
        expect(doc.toString()).to.eq(
            "# sent_id = n01001011\n"+
            "# text = “แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์\n" +
            "# text_en = “While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday.\n" +
            "# Just a comment\n" +
            "1	“	_	PUNCT	_	_	27	punct	_	SpaceAfter=No\n" +
            "2	แม้	_	ADP	_	_	10	mark	_	SpaceAfter=No\n" +
            "\n" +
            "# sent_id = n01001013\n" +
            "# text = สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย\n" +
            "# text_en = For those who follow social media transitions on Capitol Hill, this will be a little different.\n" +
            "1	สำหรับ	_	ADP	_	_	2	case	_	SpaceAfter=No\n" +
            "2	ผู้	_	NOUN	_	_	13	obl	_	SpaceAfter=No"
        )
    })
    it("test read conllu text and convert back to conllu", async () => {
        let doc = await Document.read(Readable.from(
            "# sent_id = n01001011\u000a"+
            "# text = “แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์\u000a" +
            "# text_en = “While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday.\u000a" +
            "# Just a comment\u000a" +
            "1	“	_	PUNCT	_	_	27	punct	_	SpaceAfter=No\u000a" +
            "2	แม้	_	ADP	IN	_	10	mark	_	SpaceAfter=No\u000a" +
            "\u000a" +
            "# sent_id = n01001013\u000a" +
            "# text = สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย\u000a" +
            "# text_en = For those who follow social media transitions on Capitol Hill, this will be a little different.\u000a" +
            "1	สำหรับ	_	ADP	_	_	2	case	_	SpaceAfter=No\u000a" +
            "2	ผู้	_	NOUN	NN	_	13	obl	_	SpaceAfter=No\u000a"
        ))
        expect(doc.toString()).to.eq(
            "# sent_id = n01001011\n"+
            "# text = “แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์\n" +
            "# text_en = “While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday.\n" +
            "# Just a comment\n" +
            "1	“	_	PUNCT	_	_	27	punct	_	SpaceAfter=No\n" +
            "2	แม้	_	ADP	_	_	10	mark	_	SpaceAfter=No\n" +
            "\n" +
            "# sent_id = n01001013\n" +
            "# text = สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย\n" +
            "# text_en = For those who follow social media transitions on Capitol Hill, this will be a little different.\n" +
            "1	สำหรับ	_	ADP	_	_	2	case	_	SpaceAfter=No\n" +
            "2	ผู้	_	NOUN	_	_	13	obl	_	SpaceAfter=No"
        )
    })
    it("test read conllu text and write back to buffer", async () => {
        let doc = await Document.read(Readable.from(
            "# sent_id = n01001011\u000a"+
            "# text = “แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์\u000a" +
            "# text_en = “While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday.\u000a" +
            "# Just a comment\u000a" +
            "1	“	_	PUNCT	_	_	27	punct	_	SpaceAfter=No\u000a" +
            "2	แม้	_	ADP	IN	_	10	mark	_	SpaceAfter=No\u000a" +
            "\u000a" +
            "# sent_id = n01001013\u000a" +
            "# text = สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย\u000a" +
            "# text_en = For those who follow social media transitions on Capitol Hill, this will be a little different.\u000a" +
            "1	สำหรับ	_	ADP	_	_	2	case	_	SpaceAfter=No\u000a" +
            "2	ผู้	_	NOUN	NN	_	13	obl	_	SpaceAfter=No\u000a"
        ))
        let expected = Buffer.from(
            "# sent_id = n01001011\n"+
            "# text = “แม้ว่าการเปลี่ยนไปใช้ระบบดิจิตัลเป็นสิ่งที่ไม่เคยมีมาก่อนในสหรัฐฯ การเปลี่ยนผ่านอำนาจอย่างสันตินั้นก็ไม่ใช่เรื่องใหม่” โคริ ชูลแมน ผู้ช่วยพิเศษของโอบามา เขียนลงบล็อกเมื่อวันจันทร์\n" +
            "# text_en = “While much of the digital transition is unprecedented in the United States, the peaceful transition of power is not,” Obama special assistant Kori Schulman wrote in a blog post Monday.\n" +
            "# Just a comment\n" +
            "1	“	_	PUNCT	_	_	27	punct	_	SpaceAfter=No\n" +
            "2	แม้	_	ADP	_	_	10	mark	_	SpaceAfter=No\n" +
            "\n" +
            "# sent_id = n01001013\n" +
            "# text = สำหรับผู้ที่ติดตามการเปลี่ยนผ่านโซเชียลมีเดียในแคปิตอลฮิล เรื่องนี้จะแตกต่างไปเล็กน้อย\n" +
            "# text_en = For those who follow social media transitions on Capitol Hill, this will be a little different.\n" +
            "1	สำหรับ	_	ADP	_	_	2	case	_	SpaceAfter=No\n" +
            "2	ผู้	_	NOUN	_	_	13	obl	_	SpaceAfter=No"
        )
        let actual = Buffer.alloc(expected.byteLength, '', 'utf-8')
        class BufferWriter extends Writable {
            buffer: Buffer
            len: number
            
            constructor(buf: Buffer) {
                super()
                this.buffer = buf
                this.len = 0
            }

            _write(chunk: (string | Buffer | Uint8Array | any), encoding: BufferEncoding, cb: () => void) {
                if (chunk instanceof Buffer) {
                    chunk.copy(this.buffer, this.len)
                    this.len += chunk.length
                } else if (typeof chunk == 'string') {
                    this.len += this.buffer.write(chunk, this.len, encoding)
                } else if (chunk instanceof Uint8Array) {
                    for (let b in chunk) {
                        this.buffer.write(b, this.len++)
                    }
                } else {
                    throw "Unknown type of chunk received"
                }
                cb()
            }
        }
        await doc.write(new BufferWriter(actual))
        expect(actual).to.eql(expected)
    })
})