import XRegExp from 'xregexp'
import {createReadStream, createWriteStream} from 'fs'
import {createInterface} from 'readline'
import {Readable, Writable} from 'stream'

/**
 * Attempt to convert given token to string.
 * If id array is empty or zero length then it will
 * exclue id from string.
 * If id array has exactly two element, it'll consider
 * the token to be compound token. It will print id in format
 * `id[0]-id[1]`
 */
function tokenToString({
    id = [], 
    form = "_", 
    lemma = "_", 
    upos, 
    xpos, 
    feats, 
    head, 
    deprel = "_", 
    deps, 
    misc
}: {
    id: number[],
    form?: string,
    lemma?: string,
    upos?: UPOS,
    xpos?: XPOS,
    feats?: Feature[],
    head?: HeadId,
    deprel?: Relation | string,
    deps?: [number[], Relation| string][],
    misc?: string[]
}): string {
    if (id.length == 2) {
        return `${id[0]}-${id[1]}\t${form}\t_\t_\t_\t_\t_\t_\t_\t${misc?misc.join("|"):"_"}`
    } else {
        return `${form}\t${lemma}\t${upos?upos.toString():"_"}\t${xpos?xpos.toString():"_"}\t${feats?feats.map((f)=>f.toString()).join("|"):"_"}\t${head?head:"_"}\t${deprel}\t${deps?deps.map(([id, rel]) => `${id.length == 1?id[0]:id[0] + "." + id[1]}:${rel}`).join("|"):"_"}\t${misc?misc.join("|"):"_"}`
    }
}

/**
 * Sort given deps as required by `conllu` specification that deps must be sorted 
 * by head. If head is equals, it must be sorted by relation name in alphabetic ascending order.
 * @param deps An array of tuple with `Head` and `DepsRelation` where `Head` can either be 1 integer element tuple
 * or 2 integer elements tuple if `Head` is `EmptyToken`. For example `[1]` if head is `NominalToken` and
 * `[1, 1]` if head is `EmptyToken`.
 */
function sortDeps(deps: [[HeadId] | [HeadId, EmptyId], DepsRelation][]): [[HeadId] | [HeadId, EmptyId], DepsRelation][] {
    return deps.sort((d1, d2) => {
        let headCmp = d1[0][0] - d2[0][0]
        if (headCmp != 0) {
            return headCmp // HeadIds have diff
        } else {
            if (d1[0][1] && d2[0][1]) {
                return d1[0][1] - d2[0][1] // compare Empty part
            }
        }
    })
}

/**
 * Parse a string contains one or more deps.
 * Each dep must be split by `|`. `Head` reference can either be `integer` or
 * `decimal`. For example, `1` and `1.1`.
 * `DepsRelation` associated with `Head` by using `:` to delimit the part.
 * See [enhanced dependencies](https://universaldependencies.org/u/overview/enhanced-syntax.html)
 * for valid name pattern.
 * @param str A string to be parsed into proper `Head`:`DepsRelation` object.
 * If `DepsRelation` name is invalid, it will throw an exception.
 */
function parseDeps(str: string): [[HeadId] | [HeadId, EmptyId], DepsRelation][] {
    return str.split("|").map((dep) => {
        let splitPoint = dep.indexOf(":")
        let ids = dep.slice(0, splitPoint).split(".")
        if (ids.length > 2 || ids.length == 0) {
            throw "ID of Deps must be either `int` or `int`.`int`"
        }
        let [head, empty] = ids
        let headId = parseInt(head)
        if (isNaN(headId)) {
            throw "Deps contain non-numeric head position"
        }
        if (empty != undefined) {
            let emptyId = parseInt(empty)
            if (isNaN(emptyId)) {
                throw "Deps contain non-numeric null node position"
            }
            return [[headId, emptyId], new DepsRelation(dep.slice(splitPoint + 1))]
        }
        return [[headId], new DepsRelation(dep.slice(splitPoint + 1))]
    })
}

/** Parse and return head as integer number or throw exception if it is not an integer number */
function parseHead(str: string): number {
    let id = parseInt(str)
    if (isNaN(id) || id != +str) {
        return undefined
    }
    return id
}

/**
 * Parse a string that strip '#' sign in front of the string out.
 * This is assistant function for perfomance reason to parse string and
 * return either a Comment or Meta instead of trying to parse it as Comment
 * first then try to parse it again as Meta.
 * @param str a hash stripped out line of string
 */
function parseHashLine(str: string): (Comment | Meta) {
    let idx = str.indexOf("=")
    if (idx != -1) {
        return new Meta({
            key:str.slice(0, idx).trim(),
            value: str.slice(idx + 1).trim()
        })
    } else {
        return new Comment(str)
    }
}

type EmptyTokenParseResult = [HeadId, EmptyId, EmptyToken];
type NominalTokenParseResult = [number, NominalToken]

/**
 * It attempt to parse a line of tokens.
 * @param str A string that contains a line of tokens without new line character
 * @param Parser An XPOSParser that map xpos to upos
 */
function parseToken(str: string, Parser?: XPOSParser): (CompoundToken | EmptyTokenParseResult | NominalTokenParseResult) {
    let tokens = str.split("\t")
    if (tokens.length != 10) {
        throw "Token line must contains 10 columns separate by tap"
    }
    let idx = tokens[0].indexOf("-")
    if (idx != -1) {
        // possibly compound token
        let start = +tokens[0].slice(0, idx)
        let end = +tokens[0].slice(idx + 1)
        if (Math.floor(start) != start || Math.floor(end) != end) {
            throw "Compound id must both be integer number"
        }
        return parseCompoundUncheck(start, end, tokens.slice(1))
    }
    idx = tokens[0].indexOf(".")
    if (idx != -1) {
        // possibly empty token
        let head = +tokens[0].slice(0, idx)
        let id = +tokens[0].slice(idx + 1)
        if (Math.floor(head) != head || Math.floor(id) != id) {
            throw "Empty id format must be <int>.<int> such as 1.1, 1.2, .. , 1.10"
        }
        return [head, id, parseEmptyUncheck(tokens.slice(1), Parser)]
    }
    let id = parseInt(tokens[0])
    if (isNaN(id) || id != +tokens[0]) {
        throw "ID must either be <int>.<int> or <int>-<int> or <int> such as 1, 1.2, or 1-2"
    }
    return [id, parseNominalUncheck(tokens.slice(1))]
}

/**
 * Parse a string and return an integer value of an ID or throw an exception.
 * @param str a string that may contain an integer value
 */
function parseNominalId(str: string): number {
    let id = parseInt(str)
    if (isNaN(id) || id != +str) {
        throw "The give string is not valid Nominal token"
    }
    return id
}

function parseNominal(tokens: string[], Parser?: XPOSParser): NominalTokenParseResult {
    if (tokens.length != 10) {
        throw "Require tab separate string with 10 columns"
    }
    let id = parseNominalId(tokens[0])
    return [
        id,
        parseNominalUncheck(tokens.slice(1), Parser)
    ]
}

/** 
 * Similar to parseNominal function except that it doesn't check number of element
 * in given tokens. This function will be used as a core NominalToken object construction
 * to reduce code duplicate. The tokens must be a slice stripping out the first token so
 * it will have only 9 elements.
*/
function parseNominalUncheck(tokens: string[], Parser?: XPOSParser): NominalToken {
    let head = parseHead(tokens[5])
    return new NominalToken({
        form: tokens[0], 
        lemma: tokens[1]=="_"?undefined:tokens[1], 
        upos: UPOS[tokens[2] as keyof typeof UPOS],
        xpos: Parser && tokens[3] != "_"?Parser.parse(tokens[3]):undefined,
        feats: tokens[4] != "_"?tokens[4].split("|").map((f) => {
            let [key, values] = f.split("=")
            return new Feature(key, values.split(","))
        }): undefined,
        headRel: isNaN(head)?undefined:[head, new Relation(tokens[6])],
        deps: tokens[7] != "_"?parseDeps(tokens[7]):undefined,
        misc: tokens[8] != "_"?tokens[8].split("|"): undefined
    })
}

/**
 * Parse a string that may contain a compound ID. It throw an exception if it isn't.
 * @param ids A string in format of "int-int" such as "1-2"
 */
function parseCompoundId(ids: string): [number, number] {
    let id = ids.split("-")
    if (id.length != 2) {
        throw "CompoundToken need id to be in format `[start, end]` where `end` > `start`"
    }

    let start = parseInt(id[0])
    let end = parseInt(id[1])

    if (isNaN(start) || isNaN(end) || start != +id[0] || end != +id[1]) {
        // +id[0] and +id[1] will turn the string into number which might be int or float
        // if it doesn't equals to `parseInt()` result then it's not integer
        throw "CompoundToken require both start and end to be integer number"
    }
    return [start, end]
}

function parseCompound(tokens: string[]): CompoundToken {
    if (tokens.length != 10) {
        throw "CompountToken requires tab separate string with 10 columns"
    }

    let [start, end] = parseCompoundId(tokens[0])

    return parseCompoundUncheck(start, end, tokens.slice(1))
}

/** 
 * Similar to parseCompound function but doesn't check number of element in tokens.
 * It require caller to pass in id of start and id of end token.
 * Both id are inclusive. This function will be used as a core Compound object construction.
 */
function parseCompoundUncheck(start: number, end: number, tokens: string[]): CompoundToken {
    return new CompoundToken({
        id: [start, end], 
        form: tokens[0], 
        misc: tokens[8] == "_"?undefined:tokens[8].split("|")
    })
}

/**
 * Parse a string and return pair of ids or throw an exception.
 * @param str A string contains empty id in format of "int.int" for example, "1.1"
 */
function parseEmtpyId(str: string): [HeadId, EmptyId] {
    let emptyId = str.split(".")
    if (emptyId.length != 2) {
        throw "ID of empty token must be in format `int.int`"
    }
    let headId = parseInt(emptyId[0])
    let id = parseInt(emptyId[1])
    if (isNaN(headId) || isNaN(id)) {
        throw "ID of empty token must be in format `int.int`"
    }
    return [headId, id]
}

/** Parse given string as EmptyToken along with its' ID tuple */
function parseEmpty(tokens: string[], Parser?: XPOSParser): EmptyTokenParseResult {
    if (tokens.length != 10) {
        throw "EmptyToken requires tab separate string with 10 columns"
    }
    let emptyId = tokens[0].split(".")
    if (emptyId.length != 2) {
        throw "ID of empty token must be in format `int.int`"
    }
    let [headId, id] = parseEmtpyId(tokens[0])
    if (tokens[8] == "_") {
        throw "EmptyToken requires non empty `deps` column"
    }
    return [
        headId,
        id,
        parseEmptyUncheck(tokens.slice(1), Parser)
    ]
}

/** Similar to parseEmpty but doesn't check token length nor ID. */
function parseEmptyUncheck(tokens: string[], Parser?: XPOSParser) : EmptyToken {
    return new EmptyToken({
        form: tokens[0] != "_"?tokens[0]:undefined,
        lemma: tokens[1] != "_"?tokens[1]:undefined,
        upos: tokens[2] != "_"?UPOS[tokens[2] as keyof typeof UPOS]:undefined,
        xpos: Parser && tokens[3] != "_"?Parser.parse(tokens[3]):undefined,
        feats: tokens[4] != "_"?tokens[4].split("|").map((f) => {
            let [key, values] = f.split("=")
            return new Feature(key, values.split(","))
        }):undefined,
        deps: parseDeps(tokens[7]),
        misc: tokens[8] != "_"?tokens[8].split("|"):undefined
    })
}

/**
 * Document is an entry point to `conllu`. It contains zero or more sentences.
 */
export class Document {
    sentences: Sentence[]

    constructor(sentences: Sentence[]) {
        this.sentences = sentences
    }

    /**
     * Load conllu file as Document. This method is async.
     * 
     * @param file_path Path to conllu file
     * @param Parser An optional Parser that is derivative of type XPOSParser for mapping XPOS to UPOS
     */
    public static async load(file_path: string, Parser?: XPOSParser): Promise<Document> {
        async function* yield_lines(path: string) {
            let stream = createReadStream(file_path)
            let reader = createInterface({input: stream})
            for await (let line of reader) {
                yield line
            }
            reader.close()
            stream.close()
        }
        return this.parse_core(yield_lines(file_path), Parser)
    }

    /**
     * Parse given stream line by line to construct an object of Document.
     * 
     * @param stream A stream source of text to be parse
     * @param Parser An optional Parser that is derivative of type XPOSParser for mapping XPOS to UPOS
     */
    public static async read(stream: Readable, Parser?: XPOSParser): Promise<Document> {
        async function* yield_lines(stream: Readable) {
            let lines = createInterface({input: stream})
            for await (let line of lines) {
                yield line
            }
            lines.close()
        }
        
        return this.parse_core(yield_lines(stream), Parser)
    }

    /**
     * An async utitility function that cumulatively parse each line of string then return a document.
     * 
     * @param line_iter An async generator object where each call return a line of string
     * @param Parser a Parser derivative from XPOSParser
     */
    protected static async parse_core(line_iter: AsyncGenerator<string>, Parser?: XPOSParser): Promise<Document> {
        let sentenceStr = ""
        let sentences = []
        let meta = []
        let tokens = []

        for await (let line of line_iter) {
            line = line.trim()
            sentenceStr += line

            if (line.length > 0) {
                if (line[0] == '#') {
                    meta.push(parseHashLine(line.slice(1)))
                } else {
                    let t = parseToken(line, Parser)

                    if (t instanceof CompoundToken) {
                        tokens.push(t)
                    } else if (t.length == 2) {
                        // nominal token
                        tokens.push(t[1])
                    } else if (t.length == 3) {
                        // empty token
                        tokens.push(t[2])
                    } else {
                        throw "Invalid state while parsing token line"
                    }
                }
            } else if (tokens.length > 0) {
                sentences.push(new Sentence({meta, tokens}))
                meta = []
                tokens = []
            }
        }

        if (tokens.length > 0) {
            sentences.push(new Sentence({meta, tokens}))
            meta = []
            tokens = []
        }

        return new Document(sentences)
    }

    /**
     * Attempt to parse string as a document. This method is async.
     * 
     * @param str An entire document in string where each line is terminate by '\u000a'
     * @param Parser An optional XPOSParser instance
     */
    public static async parse(str: string, Parser?: XPOSParser): Promise<Document> {
        async function* lines_iter(str: string) {
            for (let line of str.split("\u000a")) {
                yield line
            }
        }
        return this.parse_core(lines_iter(str), Parser)
    }

    /** Save this document to a file in given path. The content encoding is UTF-8 */
    public async save(path: string) {
        let stream = createWriteStream(path)
        this.write(stream)
        stream.close();
    }

    /** Return CoNLL-U string representation of the doc */
    public toString(): string {
        return this.sentences.map(sentence => sentence.toString()).join("\u000a\u000a")
    }

    /** 
     * Validate every sentence dependencies. It immediately return when there's an error.
     * Otherwise, it return SentenceValidationResult.Ok
     */
    public validate(): SentenceValidationResult {
        for (let i in this.sentences) {
            let validated = this.sentences[i].validate() 
            if (validated != SentenceValidationResult.Ok) {
                return validated
            }
        }
        return SentenceValidationResult.Ok
    }

    /** Serialize this document as CoNLL-U text into given stream */
    public async write(stream: Writable) {
        for (let sentence of this.sentences) {
            if (!stream.write(sentence.toString() + "\u000a\u000a")) {
                await new Promise((resolve) => stream.once('drain', () => {
                    resolve()
                }))
            }
        }
    }
}

/**
 * Sentence meta data.
 * 
 * It's a key/value pair. It's defined by prefixing the sentence with
 * `# key = value` format.
 */
export class Meta {
    public key: string
    public value: string

    /**
     * Construct `Meta` by given dictionary.
     * @param param0 A dic of `key` and `value` where `value` is optional.
     * If `value` is omitted, `toString` method will return `Comment` format 
     * string rather than empty value `key`
     */
    constructor({key, value}: {key: string, value?: string}) {
        this.key = key
        this.value = value
    }

    /**
     * Instantiate the object by providing a `conllu` string.
     * @param str A string to be parsed into `Meta`
     */
    public static parse(str: string): Meta {
        if (str[0] != '#') {
            throw "Meta entry must start with `#`"
        }

        str = str.slice(1).trim()
        let eqId = str.indexOf("=")
        if (eqId == -1) {
            throw "Meta entry must have `=` symbol"
        }
        let key = str.slice(0, eqId).trim()
        let value = str.slice(eqId + 1).trim()
        let meta = new Meta({key, value})
        return meta
    }

    /** Convert this object into `conllu` string */
    public toString(): string {
        if (this.key && this.value) {
            return `# ${this.key} = ${this.value}`
        } else if (this.key) {
            return `# ${this.key}`
        } else {
            throw "Missing key from meta"
        }
    }
}

/**
 * A comment of sentence. It's similar to `Meta` but doesn't have `=` symbol.
 * Similar to `Meta`, it must be prefix of sentence.
 */
export class Comment {
    public text: string

    /**
     * @param text Comment to be added
     */
    constructor(text?: string) {
        if (text) {
            text = text.trim()
            if (text.length > 0) {
                this.text = text
            }
        }
    }

    /**
     * Construct a comment object from given string.
     * @param str A string to be parse as `Comment`
     */
    public static parse(str: string): Comment {
        if (str[0] != "#") {
            throw "Comment line must begin with `#`"
        }

        let c = new Comment()
        str = str.slice(1).trim()
        if (str.length > 0) {
            c.text = str
        }

        return c
    }

    /** Get `conllu` string from this comment */
    public toString(): string {
        if (this.text && this.text.length > 0) {
            return `# ${this.text}`
        } else {
            return "#"
        }
    }
}

/**
 * A validation result for calling validate on each `Sentence`.
 * It may also throw some exceptions such as "Head of deps that reference to hidden/empty token must be in [integer, integer] format".
 */
export enum SentenceValidationResult {
    Ok,
    /** Compound token end range is beyond index of last token error */
    CompoundEndBeyondLastTokenError, 
    /** Some of compound token is overlap to other compound token error */
    CompoundOverlapError, 
    /** Compound token start index point to token prior to itself error */
    /** Head index is larger than number of tokens or less than 1 error */
    DepHeadOutOfBoundError, 
    CompoundStartAfterTokenError, 
    /** Empty token after compound token error */
    EmptyAfterCompoundError, 
    /** Head index is larger than number of tokens or less than 1 error */
    HeadOutOfBoundError, 
    /** NominalToken with head with missing deprel error */
    HeadWithoutDeprelError, 
    /** NominalToken with non-intenger value in head error */
    NonIntegerHeadError,
}

/**
 * `Sentence` consists of:
 * 1. `meta` which is array. The object inside array can either be `Meta` object or `Comment` object.
 * 1. `tokens` which is array of derivative of `Token` class.
 */
export class Sentence {
    meta: (Meta | Comment)[]
    tokens: Token[]

    /**
     * Construct a new sentence from given dictionary
     * @param param0 A dictionary object contain optional `meta` array of either
     * `Meta` or `Comment` and tokens field which is array of `Token` derivative.
     */
    constructor({meta, tokens}: {meta?: (Meta | Comment)[], tokens: Token[]}) {
        this.meta = meta
        this.tokens = tokens
    }

    /** get `conllu` formatted string of current sentence */
    public toString(): string {
        let metaStr = `${
            this.meta.map((m) => m.toString()).join("\u000a")
        }`

        let id = 1
        let hiddenId = 1
        let tokensStr = `${
            this.tokens.map((token) => {
                if (token instanceof CompoundToken) {
                    return token.toString()
                } else if (token instanceof EmptyToken) {
                    return `${id - 1}.${hiddenId++}\t${token.toString()}`
                } else if (token instanceof NominalToken) {
                    hiddenId = 1
                    return `${id++}\t${token.toString()}`
                } else {
                    throw "Unsupport type of token"
                }
            }).join("\u000a")
        }`

        return `${metaStr}\u000a${tokensStr}`
    }

    /**
     * Parse given string as `Sentence` object
     * @param str A string to be used to instantiate `Sentence`.
     * @param Parser An `XPOSParser` derivative object
     */
    public static parse(str: string, Parser?: XPOSParser): Sentence {
        let meta: (Meta | Comment)[] = []
        let tokens: Token[] = []
        for (const line of str.split('\u000a')) {
            let l = line.trim()
            if (l.startsWith("#")) {
                let eqIdx = l.indexOf("=")
                if (eqIdx == -1) {
                    meta.push(new Comment(l.slice(1)))
                } else {
                    let key = l.slice(1, eqIdx).trim()
                    let value = l.slice(eqIdx + 1).trim()
                    meta.push(new Meta({key, value}))
                }
            } else if (l.length > 0) {
                let ts = line.split("\t")
                if (ts.length != 10) {
                    throw "All token must have 10 columns"
                }
                try {
                    let [_id, tok] = parseNominal(ts, Parser)
                    tokens.push(tok)
                } catch (e) {
                    if (e === "The give string is not valid Nominal token") {
                        try {
                            let tok = parseCompound(ts)
                            tokens.push(tok)
                        } catch (e) {
                            if (e === "CompoundToken need id to be in format `[start, end]` where `end` > `start`") {
                                let [_headId, _emptyId, tok] = parseEmpty(ts, Parser)
                                tokens.push(tok)
                            }
                        }
                    }
                }
            } else {
                break
            }
        }

        return new Sentence({meta, tokens})
    }

    /** 
     * Validate current sentence whether the token structure is valid and all
     * `head`, `relation`, and `deps` are valid.
     */
    public validate(): SentenceValidationResult {
        let end = null
        let edges: boolean[] = [] // an index based that is true when head value of a node is equals to the index
        let hiddenCount: number[] = []
        let hiddenEdges: number[] = []
        let tokenCount = 0
        let compound = false
        let simplifyDeps = (deps: AdvanceDep[]) => {
            for (let dep of deps) {
                switch (dep[0].length) {
                    case 1:
                        if (!Number.isInteger(dep[0][0])) 
                            throw "Head of deps that reference to hidden/empty token must be in [integer, integer] format"
                        edges[dep[0][0]] = true
                        break
                    case 2:
                        // Head is empty token
                        if (hiddenEdges[dep[0][0]] < dep[0][1] || hiddenEdges[dep[0][0]] == undefined) {
                            hiddenEdges[dep[0][0]] = dep[0][1]
                        }
                        break
                    default:
                        throw "Invalid deps object. Head of dep must either be [number] or [number, number] "
                }
            }
        }
        /** Return false if all deps are valid, otherwise return true */
        let validateDeps = () => {
            for (let i = 1; i < hiddenEdges.length; i++) {
                if (hiddenEdges[i] == undefined) {
                    continue
                }
                if (hiddenEdges[i] > hiddenCount[i] || hiddenEdges[i] < 1) {
                    return true
                }
            }
            return false
        }
        for (let token of this.tokens) {
            if (token instanceof NominalToken) {
                tokenCount++
                hiddenCount[tokenCount] = 0
                compound = false
                
                if (token.head != undefined) {
                    if (!Number.isInteger(token.head)) {
                        return SentenceValidationResult.NonIntegerHeadError
                    } else if (token.head > this.tokens.length || token.head < 1) {
                        return SentenceValidationResult.HeadOutOfBoundError
                    } else if (!token.deprel) {
                        return SentenceValidationResult.HeadWithoutDeprelError
                    }

                    edges[token.head] = true
                }

                if (token.deps) {
                    simplifyDeps(token.deps)
                }

                if (end != null && end == tokenCount) {
                    end = null
                }
            } else if (token instanceof CompoundToken) {
                if (end != null) {
                    return SentenceValidationResult.CompoundOverlapError
                }

                end = token.id[1]
                compound = true

                if (token.id[0] >= tokenCount && tokenCount != 0) {
                    return SentenceValidationResult.CompoundStartAfterTokenError
                } 
            } else if (token instanceof EmptyToken) {
                hiddenCount[tokenCount]++
                simplifyDeps(token.deps)

                if (compound)
                    return SentenceValidationResult.EmptyAfterCompoundError
            }
        }
        if (edges.length > tokenCount + 1) { // need to + 1 because edges is zero based
            return SentenceValidationResult.HeadOutOfBoundError
        } else if (validateDeps()) {
            return SentenceValidationResult.DepHeadOutOfBoundError
        } else if (end == null) {
            return SentenceValidationResult.Ok
        } else {
            return SentenceValidationResult.CompoundEndBeyondLastTokenError
        }
    }
}

/** Root ancestor that all type of Token should inherit from */
export abstract class Token {
    /** Format the token into `conllu` string */
    abstract toString(): string;
}

export type IdRange = [FirstId, LastId]
export type FirstId = number
export type LastId = number

/**
 * A CompoundToken is a token which `id` is a range between [start, end] inclusively
 * at both start and end index.
 * 
 * The token requires `id` and `form` with optionally `misc` column.
 * 
 * All other fields, when convert to string, has `_` values.
 * ID in string format will be `start`-`end`, e.g. `1-2`.
 * The `end` index must be greater than start. It is an error to have ID with
 * `[1, 1]`
 */
export class CompoundToken implements Token {
    id: [number, number]
    form: string
    misc?: string[]

    constructor({id: [start, end], form, misc}: {id: IdRange, form: string, misc?: string[]}) {
        if (end <= start) {
            throw "CompountToken id range must be in `[start, end]` where `end` > `start`"
        }
        this.id = [start, end]
        this.form = form
        this.misc = misc
    }

    /**
     * Parse given string and return a `CompoundToken`
     * 
     * The string must be tab separate with 10 columns.
     * See https://universaldependencies.org/format.html for file format.
     * 
     * Only `id`, `form`, and `misc` columns are use.
     * All other columns are ignored as 
     * https://universaldependencies.org/format.html#words-tokens-and-empty-nodes
     * state that all other columns beside these three must be empty.
     */
    public static parse(str: string) : CompoundToken {
        let cols = str.split("\t")

        return parseCompound(cols)
    }

    public toString(): string {
        return tokenToString(this)
    }
}

export type HeadId = number
export type AdvanceDep = [[HeadId] | [HeadId, EmptyId], DepsRelation]

/**
 * Nominal token is a basic type of token which must exist in `Sentence` in order to
 * use other type of token.
 * 
 * The mandatory field is `form` and `upos`. All other fields are optional.
 * All optional field, when converted to string, will become "_".
 */
export class NominalToken implements Token {
    form: string
    lemma?: string
    upos: UPOS
    xpos?: XPOS
    feats?: Feature[]
    head?: HeadId
    deprel?: Relation
    deps?: AdvanceDep[]
    misc?: string[]

    constructor({form, lemma, upos, xpos, feats, headRel, deps, misc}: {form: string, lemma: string, upos: UPOS, xpos?: XPOS, feats?: Feature[], headRel?: [HeadId, Relation], deps?: [[HeadId] | [HeadId, EmptyId], DepsRelation][], misc?: string[]}) {
        if (deps && !deps.every((dep) => dep[0].length == 1 || dep[0].length == 2)) {
            throw "NominalToken `deps` id must be array with either 1 or 2 number"
        }
        this.form = form
        this.lemma = lemma
        this.upos = upos
        this.xpos = xpos
        this.feats = feats?feats.sort((f1, f2) => f1.name.localeCompare(f2.name)):undefined
        this.head = headRel?headRel[0]:undefined
        this.deprel = headRel?headRel[1]:undefined
        this.deps = deps?sortDeps(deps):undefined
        this.misc = misc
    }

    /**
     * Parse given string and construct a `NominalToken` out of it.
     * If text contains XPOS column and you need to keep XPOS field, you
     * need to supply a name of an implementation of `XPOSParser`. 
     * @param str A string to be parsed
     * @param XPOSParser XPOS parser to convert given column into an object of `XPOS`
     */
    public static parse(str: string, Parser?: XPOSParser): NominalTokenParseResult {
        let cols = str.split("\t")
        return parseNominal(cols, Parser)
    }

    public toString(): string {
        return tokenToString({id: [], ...this})
    }
}

export type EmptyId = number

/**
 * `EmptyToken` is a null token type. Everything except `deps` are optional.
 */
export class EmptyToken implements Token {
    form?: string
    lemma?: string
    upos?: UPOS
    xpos?: XPOS
    feats?: Feature[]
    deps: AdvanceDep[]
    misc?: string[]

    constructor({form, lemma, upos, xpos, feats, deps, misc}: {form?: string, lemma?: string, upos?: UPOS, xpos?: XPOS, feats?: Feature[], deps: [[HeadId] | [HeadId, EmptyId], DepsRelation][], misc?: string[]}) {
        this.form = form
        this.lemma = lemma
        this.upos = upos
        this.xpos = xpos
        this.feats = feats?feats.sort((f1, f2) => f1.name.localeCompare(f2.name)):undefined
        this.deps = deps?sortDeps(deps):undefined
        this.misc = misc
    }

    /**
     * Parse given string and return an `EmptyToken`.
     * @param str 
     * @param Parser 
     */
    public static parse(str: string, Parser?: XPOSParser): EmptyTokenParseResult {
        let cols = str.split("\t")
        return parseEmpty(cols, Parser)
    }

    public toString(): string {
        return tokenToString({id: [], ...this})
    }
}

export enum UPOS {
    ADJ = "ADJ",
    ADP = "ADP",
    ADV = "ADV",
    AUX = "AUX",
    CCONJ = "CCONJ",
    DET = "DET",
    INTJ = "INTJ",
    NOUN = "NOUN",
    NUM = "NUM",
    PART = "PART",
    PRON = "PRON",
    PROPN = "PROPN",
    PUNCT = "PUNCT",
    SCONJ = "SCONJ",
    SYM = "SYM",
    VERB = "VERB",
    Other = "X"
}

export function toUPOS(str: string): UPOS {
    return UPOS[str as keyof typeof UPOS]
}

export abstract class XPOS {
    abstract toUPOS(): UPOS;
    abstract toString(): string;
}

export abstract class XPOSParser {
    abstract parse(str: string): XPOS;
}

const featureNameValidator = /^[A-Z0-9][A-Z0-9a-z]*(\[[a-z0-9]+\])?$/
const featureValValidator = /^[A-Z0-9][a-zA-Z0-9]*$/

export class Feature {
    name: string
    value: string[]

    constructor(name: string, value: string[]) {
        if (value.length > 0 && featureNameValidator.test(name)) {
            this.name = name
            if (!value.every((v: string) => {
                return featureValValidator.test(v)
            })) {
                throw "All feature value must match with this regex: [A-Z0-9][a-zA-Z0-9]*"
            }
            this.value = value.sort()
        } else {
            throw "Feature name must match with this regex: [A-Z0-9][A-Z0-9a-z]*(\\[[a-z0-9]+\\])?"
        }
    }

    public toString(): string {
        return this.name + "=" + this.value.join(',')
    }
}

const depsRelValidator = XRegExp('^[a-z]+(:[a-z]+)?(:[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+(_[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+)*)?(:[a-z]+)?$')

export class DepsRelation {
    rel: string

    constructor(rel: string) {
        if (!depsRelValidator.test(rel)) {
            throw "Relation value in `deps` field must match this regex: ^[a-z]+(:[a-z]+)?(:[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+(_[\\p{Ll}\\p{Lm}\\p{Lo}\\p{M}]+)*)?(:[a-z]+)?$"
        }

        this.rel = rel
    }

    public toString(): string {
        return this.rel
    }
}

const relationValidator = /^[a-z]+(:[a-z]+)?$/

export class Relation {
    rel: string

    constructor(rel: string) {
        if (!relationValidator.test(rel)) {
            throw "`deprel` field must match following regex: ^[a-z]+(:[a-z]+)?$"
        }
        this.rel = rel
    }

    public toString(): string {
        return this.rel
    }
}

// export type Relation = "acl" |      // clausal modifier of noun (adjectival clause)
//                        "advcl" |    // adverbial clause modifier
//                        "advmod" |   // adverbial modifier
//                        "amod" |     // adjectival modifier
//                        "appos" |    // appositional modifier
//                        "aux" |      // auxiliary
//                        "case" |     // case marking
//                        "cc" |       // coordinating conjunction
//                        "ccomp" |    // clausal complement
//                        "clf" |      // classifier
//                        "compound" | // compound
//                        "conj" |     // conjunct
//                        "cop" |      // copula
//                        "csubj" |    // clausal subject
//                        "dep" |      // unspecified dependency
//                        "det" |      // determiner
//                        "discourse" |// discourse element
//                        "dislocated"|// dislocated elements
//                        "expl" |     // expletive
//                        "fixed" |    // fixed multiword expression
//                        "flat" |     // flat multiword expression
//                        "goeswith" | // goes with
//                        "iobj" |     // indirect object
//                        "list" |     // list
//                        "mark" |     // marker
//                        "nmod" |     // nominal modifier
//                        "nsubj" |    // nominal subject
//                        "nummod" |   // numeric modifier
//                        "obj" |      // object
//                        "obl" |      // oblique nominal
//                        "orphan" |   // orphan
//                        "parataxis"| // parataxis
//                        "punct" |    // punctuation
//                        "reparandum"|// overridden disfluency
//                        "root" |     // root
//                        "vocative" | // vocative
//                        "xcomp"      // open clausal complement

export class NounClassFeat {
    langGroup: string
    num: number
}