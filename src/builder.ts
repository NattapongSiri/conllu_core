import assert from "assert";
import { AdvanceDep, Comment, CompoundToken, DepsRelation, EmptyToken, Feature, HeadId, Meta, NominalToken, Relation, Sentence, Token, TokenIdMap, TokenType, UPOS, XPOS } from ".";

/** 
 * The policy to adjust a `head` field that point to a token being merge.
 * Every other tokens will have their head value adjust accordingly but the `head` that point
 * to token being merge may need different treatment depending on user requirement.
 */
export enum HeadPolicy {
    /** Update all the `head` pointed to the token within merge range to a merged `ID` */
    Adjust,
    /** Remove any `head` linked to the token within merge range */
    Remove,
}

/**
 * A sentence builder that assist user on manipulating the `Sentence`.
 * Key methods are:
 * - `merge` - To merge tokens into one. It take inclusive index of token at both start and end. Type of token at both end must have the same type. It doesn't yet support merging compound token yet. It support custom merging strategy by extend class `MergePolicy`. See class `MergePolicy` for default operation on merge.
 * - `split` - To split a token into multiple tokens. It take an array of index of character position in `form` field of token. Similar to `merge`, user can define custom strategy on splitting token by extends a class `SplitPolicy`.
 * - `insert_token` - Insert a new token at specific index.
 * - `remove_token` - Remove a token from specific index and resolve dependencies according to given `HeadPolicy`. This operation may cause some token to have a self dependency.
 * - `upsert_head_by_index` - Set a new head to a token at given index.
 * - `upsert_dep_by_index` - Update or insert a dependency to a token at given index.
 * - `remove_self_dependencies` - To automatically remove all dependencies that point to itself. This operation may result in validation failure as some `deps` of some `EmptyToken` may become empty.
 * 
 * It is possible to instantiate the builder by `new SentenceBuilder` or by `SentenceBuilder.from(sentence)`
 */
export class SentenceBuilder {
    meta: (Meta | Comment)[]
    tokens: Token[]
    id_map: TokenIdMap

    /**
     * Make this builder out of existing Sentence.
     * It will make a shallow copy of existing sentence so any modification
     * with this builder will also immediately reflect on original sentence.
     */
    static from(sentence: Sentence): SentenceBuilder {
        let builder = new SentenceBuilder()
        builder.meta = sentence.meta
        builder.tokens = sentence.tokens
        builder.id_map = new TokenIdMap()
        let id = 0
        let empty_id = 0
        for (let t of sentence.tokens) {
            if (t instanceof NominalToken) {
                builder.id_map.push(++id)
                empty_id = 0
            } else if (t instanceof EmptyToken) {
                builder.id_map.push([id, ++empty_id])
            } else if (t instanceof CompoundToken) {
                builder.id_map.push(undefined)
            } else {
                throw `Unsupported token type. Found ${t.constructor.name}`
            }
        }
        return builder
    }
    /** 
     * Append given meta into this sentence.
     * This method return the builder itself so it can be chain.
     */
    push_meta(key: string, value: string): SentenceBuilder {
        this.meta.push(new Meta({key, value}))
        return this
    }
    /** 
     * Append comment into this sentence.
     * This method return the builder itself so it can be chain.
     */
    push_comment(text: string): SentenceBuilder {
        this.meta.push(new Comment(text))
        return this
    }
    /** Find meta by given `key`. This method return Meta object */
    find_meta(key: string): Meta {
        return this.meta.find((m) => {
            if (m instanceof Meta) m.key == key
        }) as Meta
    }
    /** Find index of meta from given `key`. This method return index number. */
    find_meta_index(key: string): number {
        return this.meta.findIndex((m) => m instanceof Meta && m.key == key)
    }
    /** 
     * Append given token into this sentence.
     * This method return the builder itself so it can be chain.
     */
    push_token(t: Token): SentenceBuilder {
        this.tokens.push(t)
        if (t instanceof NominalToken) this.id_map.insert(this.id_map.length, TokenType.Nominal)
        else if (t instanceof CompoundToken) this.id_map.insert(this.id_map.length, TokenType.Compound)
        else if (t instanceof EmptyToken) this.id_map.insert(this.id_map.length, TokenType.Empty)
        else throw `Unsupported type of Token. Found ${t.constructor.name}`

        return this
    }
    /**
     * Append all tokens into this sentence.
     * This method return the builder itself so it can be chain.
     */
    push_tokens(...tokens: Token[]) : SentenceBuilder {
        for (let t of tokens) {
            this.push_token(t)
        }
        return this
    }
    /** Find a token by an `id`. This method return Token */
    find_token_by_id(id: number | [number, number], type: TokenType): Token {
        switch (type) {
            case TokenType.Nominal:
                assert(typeof id == "number", "ID of Nominal token must be number")
                let index_nom = this.id_map.findIndex(_id => _id == id)
                return index_nom == -1?undefined:this.tokens[index_nom]
            case TokenType.Empty:
                assert(id instanceof Array, "ID of Empty token must be [number, number]")
                let index_empty = this.id_map.findIndex(_id => _id == id)
                return index_empty == -1?undefined:this.tokens[index_empty]
            case TokenType.Compound:
                assert(id instanceof Array && id.length == 2, `Retrieving Comound token need [number, number] ID. Found ${id}`)
                let id_nom = (id as [number, number])[0]
                let index_neighbor = this.id_map.findIndex(_id => _id == id_nom)
                if (index_neighbor > 0 && this.tokens[index_neighbor - 1] instanceof CompoundToken) {
                    let compound = this.tokens[index_neighbor - 1] as CompoundToken
                    if (compound.id[1] == (id as [number, number])[1]) {
                        return compound
                    } else {
                        return undefined
                    }
                } else {
                    return undefined
                }
            default:
                throw "Unsupported TokenType"
        }
    }
    /** 
     * Get id of token at given index or undefined if token at given index is Compound token.
     * This method return ID of given index.
     */
    get_id_by_index(index: number): number | [number, number] {
        assert(index < this.id_map.length, `Index out of bound. Length is ${this.id_map.length} but index is ${index}`)
        return this.id_map[index]
    }
    /** 
     * Set head and deprel field of token at given `token_index` argument to ID of token at `head_index`. 
     * This method return the builder itself so it can be chain.
     */
    upsert_head_by_index(token_index: number, head_index: number, relation: Relation): SentenceBuilder {
        let token = this.tokens[token_index]
        let head_tok = this.tokens[head_index]
        if (token instanceof NominalToken && head_tok instanceof NominalToken) {
            let id = this.id_map[head_index] as number
            token.head = id
            token.deprel = relation
        } else {
            throw `Both tokens must be NominalToken but at ${token_index} found ${token.constructor.name} and ${head_index} found ${head_tok.constructor.name}`
        }

        return this
    }
    /** 
     * Add or replace a dep in deps field of given token index. The dep to be add/replace use head index instead of ID.
     * This method return the builder itself so it can be chain.
     */
    upsert_dep_by_index(token_index: number, head_index: number, relation: DepsRelation): SentenceBuilder {
        let token = this.tokens[token_index]
        let head_tok = this.tokens[head_index]
        if (token instanceof NominalToken || token instanceof EmptyToken) {
            let set_dep = (token: NominalToken | EmptyToken, id: ([number] | [number, number]), relation: DepsRelation) => {
                if (token.deps) {
                    let exist_index = token.deps.findIndex((dep) => dep[0] == id)
                    if (exist_index != -1) {
                        token.deps[exist_index] = [id, relation]
                    } else {
                        // Find insertion point
                        let index = 0
                        for (; index < token.deps.length; index++) {
                            if (token.deps[index][0] > id) {
                                index--
                                break
                            }
                        }
                        // Insert token at found insertion point
                        token.deps.splice(index, 0, [id, relation])
                    }
                } else {
                    token.deps = [[id, relation]]
                }
            }
            if (head_tok instanceof NominalToken) {
                set_dep(token, [this.id_map[head_index] as number], relation)
            } else if (head_tok instanceof EmptyToken) {
                set_dep(token, this.id_map[head_index] as [number, number], relation)
            } else {
                throw `Token at ${head_index} must either be NominalToken or EmptyToken but found ${head_tok.constructor.name}`
            }
        } else {
            throw `Token at ${token_index} must either be NominalToken or EmptyToken but found ${token.constructor.name}`
        }

        return this
    }
    /** 
     * Insert a `token` at given `index`. The index must be <= number of existing tokens. 
     * This method return the builder itself so it can be chain.
     */
    insert_token(token: Token, index: number): SentenceBuilder {
        assert(index <= this.tokens.length, `Index out of bound. Total number of tokens is ${this.tokens.length} but index is ${index}`)
        let update_dependencies = (update_deps: (deps: AdvanceDep[]) => void) => {
            for (let t of this.tokens) {
                if (t instanceof NominalToken) {
                    if (t.head && t.head >= this.id_map[index]) {
                        t.head++
                    }
                    if (t.deps)
                        update_deps(t.deps)
                } else if (t instanceof EmptyToken) {
                    update_deps(t.deps)
                }
            }
        }
        if (token instanceof NominalToken) {
            update_dependencies((deps: AdvanceDep[]) => {
                for (let dep of deps) {
                    if (dep[0][0] >= this.id_map[index]) {
                        dep[0][0]++
                    }
                }
            })
            this.id_map.insert(index, TokenType.Nominal)
        } else if (token instanceof EmptyToken) {
            update_dependencies((deps: AdvanceDep[]) => {
                for (let dep of deps) {
                    if (dep[0] >= this.id_map[index]) {
                        dep[0][1]++
                    }
                }
            })
            this.id_map.insert(index, TokenType.Empty)
        } else if (token instanceof CompoundToken) {
            // Compound token doesn't impact head, deps, or ID of other token
            this.id_map.insert(index, TokenType.Compound)
        } else {
            throw `Unsupported type of token. Found ${token.constructor.name}`
        }
        this.tokens.splice(index, 0, token)

        return this
    }

    /**
     * Remove any entry in `deps` field that point to it own token.
     * Any `head` that point to itself will be pointed to root token.
     * This method fix an issue of a token have dependencies to itself.
     * However, it may introduce an issue where there's only one dependencies in
     * `deps` field that point to itself which is an EmptyToken. In such case,
     * `validate` will return `EmptyTokenWithoutDepsError`
     */
    public remove_self_dependencies() {
        function update_deps(id: number | [number, number], deps: AdvanceDep[]) {
            return deps.filter((dep) => dep[0] != id)
        }
        let root_idx = this.tokens.findIndex((t) => {
            if (t instanceof NominalToken) {
                return t.head == 0
            } else {
                return false
            }
        })
        let root_id = this.id_map[root_idx] as number
        for (let i = 0; i < this.tokens.length; i++) {
            let id = this.id_map[i]
            let token = this.tokens[i]
            if (token instanceof NominalToken && token.head && token.head == id) {
                token.head = root_id
                if (token.deps) {
                    token.deps = update_deps(id, token.deps)
                }
            } else if (token instanceof EmptyToken) {
                token.deps = update_deps(id, token.deps)
            }
        }
    }
    /** 
     * Remove a token at given index and update all dependencies to it based on given policy. 
     * It return the removed token original field value.
     * Some token removal may cause some other tokens to have self dependency.
     * There's method `remove_self_dependencies` that may be useful for such situation.
     */
    remove_token(index: number, policy = HeadPolicy.Adjust): Token {
        assert(index < this.tokens.length, `Index out of bound. Index is ${index} but length is ${this.tokens.length}`)
        let update_core = (update_head: (t: NominalToken) => void, update_deps: (deps: AdvanceDep[], index: number) => number) => {
            for (let i = 0; i < this.tokens.length; i++) {
                if (i == index) continue
                let t = this.tokens[i]
                if (t instanceof NominalToken)
                    update_head(t)
                let deps: AdvanceDep[] = []
                if ((t instanceof NominalToken || t instanceof EmptyToken) && t.deps) {
                    deps = t.deps
                }
                for (let j = 0; j < deps.length;) {
                    j = update_deps(deps, j)
                }
            }
        }
        if (this.tokens[index] instanceof EmptyToken) {
            // Remove empty token
            let id = this.id_map[index] as [number, number]
            let update = (apply: (dep: AdvanceDep[], index: number) => number) => {
                update_core(() => {}, apply)
            }
            switch(policy) {
                case HeadPolicy.Adjust:
                    update((deps, i) => {
                        if (deps[i][0].length == 2 && deps[i][0][0] == id[0] && deps[i][0][1] >= id[1] && deps[i][0][1] > 1) 
                            deps[i][0][1]--
                        return i + 1
                    })
                    break
                case HeadPolicy.Remove:
                    update((deps, i) => {
                        if (deps[i][0] == id) deps.splice(i, 1)
                        return i
                    })
                    break
                default:
                    throw `Unsupported update policy. Found ${HeadPolicy[policy]}`
            }
            
        } else if (this.tokens[index] instanceof NominalToken) {
            // Remove nominal token
            let id = this.id_map[index] as number
            switch (policy) {
                case HeadPolicy.Adjust:
                    update_core((t) => {
                        if (t.head && t.head >= id && t.head > 1) t.head--
                    }, (deps, i) => {
                        if (deps[i][0][0] >= id) deps[i][0][0]--
                        return i + 1
                    })
                    break
                case HeadPolicy.Remove:
                    update_core((t) => {
                        if (t.head && t.head == id) t.head = undefined
                    }, (deps, i) => {
                        if (deps[i][0][0] == id) deps.splice(i, 1)
                        return i
                    })
                    break
                default:
                    throw `Unsupported update policy. Found ${HeadPolicy[policy]}`
            }
        } 
        this.id_map.remove_chunk(index, 1)
        let token = this.tokens.splice(index, 1)
        return token
    }
    /** 
     * Merge tokens using index, not ID. 
     * Both `from` and `to` are index of token.
     * It's inclusive at both end so if `from = 1`, and `to = 2`, it will merge
     * token at index 1 and 2 into 1 token.
     * The field value of merged token will depends on `policy`.
     * If the merged token have a dep that pointed to itself, such dep will be automatically removed.
     * This method return the builder itself so it can be chain.
     */
    merge<X extends XPOS>(from: number, to: number, policy=new MergePolicy<X>()): SentenceBuilder {
        assert(from < this.tokens.length, `Argument from is ${from} while there is ${this.tokens.length} tokens`)
        assert(from < to, "Argument from is larger or equals to argument to")
        assert(this.tokens[from].constructor === this.tokens[to].constructor, `Token at ${from} is ${this.tokens[from].constructor.name} and ${to} is ${this.tokens[to].constructor.name} but its should have the same type`)
        assert(this.tokens[from] instanceof NominalToken || this.tokens[from] instanceof EmptyToken, "First merginng token must either be `NominalToken` or `EmptyToken`")
        
        if (this.tokens[from] instanceof EmptyToken) {
            assert(this.tokens.slice(from, to + 1).every((t) => t instanceof EmptyToken), "Not every tokens within the range is empty token")
            let [id, empty_id] = this.id_map[from] as [number, number]
            // update deps field
            let offset = to - from
            let to_id = empty_id + offset
            /**
             * A core algorithm to update deps field
             * @param update A callback function that responsible for update dep at given index.
             * The callback must return next index to evaluate.
             */
            let update_core = (update: (deps: AdvanceDep[],dep_index: number, token_index: number) => number) => {
                for (let i = 0; i < this.tokens.length; i++) {
                    // if (i >= from && i <= to) continue
                    let token = this.tokens[i]
                    if ((token instanceof NominalToken || token instanceof EmptyToken) && token.deps) {
                        let j = 0
                        while (j < token.deps.length) {
                            let dep = token.deps[j]
                            if (dep[0][0] == id) {
                                if (dep[0][1] > to_id){
                                    dep[0][1] -= offset
                                } else if (dep[0][1] > empty_id && dep[0][1] <= to_id) {
                                    j = update(token.deps, j, i)
                                    continue
                                }
                            }
                            j++
                        }
                    }
                }
            }
            switch (policy.headPol) {
                case HeadPolicy.Adjust:
                    update_core((deps, i, j): number => {
                        deps[i][0][1] = empty_id
                        return i + 1
                    })
                    break
                case HeadPolicy.Remove:
                    update_core((deps, i): number => {
                        deps.splice(i, 1)
                        return i
                    })
                    break
                default:
                    throw "Not yet implemented HeadPolicy type "
            }
    
            // The token between from_idx to to_idx will all be EmptyToken
            // We also don't have to worry about CompoundToken 
            let tokens: EmptyToken[] = this.tokens.slice(from, to + 1) as EmptyToken[]
            
            // Merge all empty token in given range
            _merge(tokens, policy)
            this.tokens.splice(from + 1, offset)
            this.id_map.remove_chunk(from + 1, offset)
        } else {
            // Due to assertion above, it's nominal token
            let id = this.id_map[from] as number
            let to_id = this.id_map[to] as number
            
            let offset = to_id - id
            
            // Scan for compound token that will become invalid
            // Compound must be in front of nominal token according to CoNLL-U spec.
            for (let i = from - 1; i >= 0; i--) {
                let token = this.tokens[i]
                if (token instanceof CompoundToken) {
                    let [_, end] = token.id
                    if (to_id <= end) {
                        // Merge will cause compound end ID to be invalid but it can be fix.
                        token.id[1] = end - (to_id - id) // Fix by reduce equals to number of token being merged
                    } else if (to_id > end) {
                        // Merge token will cause compound end ID to be invalid. It can be fix using some math.
                        // The (end - from) is a number of tokens within the compound that is getting merge.
                        // New end will be point to ID of merged token thus equals to the last token
                        // within the compound that is not getting merge + 1
                        token.id[1] = id
                    }
                    break // compound token cannot be overlap so the first nearest compound found is the only possible one to become invalid
                }
            }
    
            // Update head/deprel
    
            /** 
             * Common update head, deprel, and deps algorithm.
             * It take two callbacks.
             * - `update_head` callback which will be called when the given token have head field pointed to a merging token
             * - `update_deps` callback which will be called when given index need to update head.
             * It need to return next index of deps to be check. 
             */
            let update_core = (update_head: (token: NominalToken) => void, update_deps: (deps: AdvanceDep[], i: number) => number) => {
                /** Common deps field update algorithm for both Nominal and Empty token */
                let core_deps = (deps: AdvanceDep[]) => {
                    if (deps) {
                        let j = 0
                        while (j < deps.length) {
                            let dep = deps[j]
                            if (dep[0][0] >= to_id) {
                                dep[0][0] -= offset // Adjust head id of all subsequence tokens
                            } else if (dep[0][0] >= id && dep[0][0] < to_id) {
                                j = update_deps(deps, j) // Update dep at given index j because it pointed to merging token
                                continue
                            }
                            j++
                        }
                    }
                }
                for (let i = 0; i < this.tokens.length; i++) {
                    // if (i > from && i <= to) continue // these index will be removed anyway
                    let token = this.tokens[i]
                    if (token instanceof NominalToken) {
                        if (token.head > to_id) {
                            token.head -= offset // adjust all subsequence tokens
                        } else if (token.head >= id && token.head <= to_id) {
                            update_head(token) // update head that pointed in a merge range
                        } 
                        core_deps(token.deps) // process deps field
                    } else if (token instanceof EmptyToken) {
                        core_deps(token.deps)
                    }
                }
            }
            switch (policy.headPol) {
                case HeadPolicy.Remove:
                    let update_head_remove = (token: NominalToken) => {
                        token.head = undefined
                        token.deprel = undefined
                    }
                    let update_deps_remove = (deps: AdvanceDep[], i: number): number => {
                        deps.splice(i, 1)
                        return i // It doesn't need to increment `i` as it remove itself out so the cursor is literally incremented
                    }
                    update_core(update_head_remove, update_deps_remove)
                    break
                case HeadPolicy.Adjust:
                    let update_head_adjust = (token: NominalToken) => {
                        token.head = id
                    }
                    let update_deps_adjust = (deps: AdvanceDep[], i: number): number => {
                        // Adjust all dep 
                        deps[i][0][0] = id
                        if (deps[i][0].length == 2) {
                            // every empty token inside merging range will be remove
                            // so it should only pointed to the merged id
                            deps[i][0].pop()
                        }
                        return i + 1 // We need to increment cursor to check for next dep
                    }
                    update_core(update_head_adjust, update_deps_adjust)
                    break
                default:
                    throw "Not yet implemented HeadPolicy type"
            } 
    
            // Now merge tokens into head token.
    
            let tokens: NominalToken[] = []
            for (let token of this.tokens.slice(from, to + 1)) {
                if (token instanceof NominalToken) {
                    tokens.push(token)
                }
            }
            
            _merge(tokens, policy)
    
            // Remove all merged tokens
            this.tokens.splice(from + 1, to - from)
            this.id_map.remove_chunk(from + 1, to - from)
        }
        // Cleanup dep. Assume it's Nominal as assert will guarantee that it's either Nominal or Empty
        let token = this.tokens[from] as NominalToken

        if (token.deps) {
            if (this.id_map[from] instanceof Array) {
                let id = this.id_map[from] as [number, number]
                // filter only dep that has length != 2 or dep ID is not equals to head of the merge's ID
                token.deps = token.deps.filter((dep) => dep[0].length != 2 || !dep[0].every((v, i) => v == id[i]))
            } else {
                let id = this.id_map[from] as number
                token.deps = token.deps.filter((dep) => dep[0].length == 2 || dep[0][0] != id)
            }
        }

        return this
    }
    /**
     * Split a token at given `index`. It take `at` argument which is a list of index
     * of location of `form` field of a token to be splitted. All other fields depends
     * on `policy` argument.
     * It update all other dependencies by shifting all the ID accordingly.
     * 
     * The token at given `index` must either be NominalToken or EmptyToken.
     * This method return the builder itself so it can be chain.
     */
    split(index: number, at: number[], policy = new SplitPolicy()): SentenceBuilder {
        assert(index < this.tokens.length, `Index out of bound. Sentence has ${this.tokens.length} tokens but index is ${index}`)
        assert(this.tokens[index] instanceof NominalToken || this.tokens[index] instanceof EmptyToken, `Sentence at given index must either be NominalToken or EmptyToken but found ${this.tokens[index].constructor.name}`)
        assert(at.length > 0, "Argument at must have one or more element")

        // sort at first so the slice will always valid
        at.sort()
        assert(at[at.length - 1] < (this.tokens[index] as NominalToken | EmptyToken).form.length, "Split point is beyond surface form text length")
        let tokens = this.tokens
        let offset = at.length
        let id = 0
        let empty_id = 0
        let token = tokens[index] as (NominalToken | EmptyToken)
        assert(token.form && token.form.length != 0, `Token to be split must have a form field value`)

        // Update `head` and `deps` field of every token except at a splitting token
        let update_deps = (_: AdvanceDep[]) => {}

        // Define update_deps function based on current type of token at given index.
        // We take this chance to update `id_map` 
        if (token instanceof EmptyToken) {
            this.id_map.insert(index + 1, TokenType.Empty, offset - 1)
            id = (this.id_map[index] as number[])[0]
            empty_id = (this.id_map[index] as number[])[1]
            update_deps = (deps: AdvanceDep[]) => {
                if (deps)
                    for (let i = 0; i < deps.length && deps[i][0][0] <= id; i++) 
                        if (deps[i][0][0] == id && deps[i][0][1] > empty_id)
                            deps[i][0][1] += offset
            }
        } else if (token instanceof NominalToken) {
            this.id_map.insert(index + 1, TokenType.Nominal, offset - 1)
            id = this.id_map[index] as number
            update_deps = (deps: AdvanceDep[]) => {
                if (deps)
                    for (let i = 0; i < deps.length; i++)
                        if (deps[i][0][0] > id) 
                            deps[i][0][0] += offset
            }
        } else {
            throw `Not yet implemented for type ${this.tokens[index].constructor.name}`
        }
        
        // Compound cannot be overlap so there will be exactly one compound that contain the token
        for (let i = index - 1; i >= 0; i--) {
            let token = this.tokens[i]
            if (token instanceof CompoundToken && token.id[0] <= id && token.id[1] >= id) {
                // Expand compound token that had token at given index as part of compound
                token.id[1] += offset
                break
            }
        }
        
        // Perform update dependencies on each token
        if (token instanceof NominalToken)
            for (let t of tokens) {
                if (t instanceof NominalToken) {
                    if (t.head > id) 
                        t.head += offset
                    update_deps(t.deps)
                } else if (t instanceof EmptyToken) update_deps(t.deps)
            }
        else
            for (let t of tokens) {
                if (t instanceof NominalToken || t instanceof EmptyToken)
                    update_deps(t.deps)
            }
            
        let i = at[0]
        let insert_point = index + 1
        let insert = (token: NominalToken | EmptyToken, i: number, j: number) => {
            let new_form = token.form.slice(i, j)
            let lemma = policy.lemma(token)
            let upos = policy.upos(token)
            let xpos = policy.xpos?policy.xpos(token):undefined
            let feats = policy.feats(token)
            let deps = policy.deps(token)
            let misc = policy.misc(token)

            if (token instanceof NominalToken) {
                let headRel = policy.headRels(token)
                tokens.splice(insert_point++, 0, new NominalToken({
                    form: new_form,
                    lemma,
                    upos,
                    xpos,
                    feats,
                    headRel,
                    deps,
                    misc
                }))
            } else {
                tokens.splice(insert_point++, 0, new EmptyToken({
                    form: new_form,
                    lemma,
                    upos,
                    xpos,
                    feats,
                    deps,
                    misc
                }))
            }
        }
        
        for (let j of at.slice(1)) {
            // The token can be either Nominal or EmptyToken. Otherwise, assertion will fail.
            insert(token, i, j)
            i = j
        }
        insert(token, i, token.form.length)

        // Reuse existing token at given `index`
        token.form = (tokens[index] as NominalToken | EmptyToken).form.slice(0, at[0])

        return this
    }
    // TODO Create CompoundToken based on given index
    
    /** Remove all the tokens from this builder */
    clear() {
        this.meta.length = 0
        this.tokens.length = 0
        this.id_map.length = 0
    }

    /** Build Sentence object out of this builder */
    build(): Sentence {
        return new Sentence({meta: this.meta, tokens: this.tokens})
    }
}

type NonCompound = (NominalToken | EmptyToken)

function nominal_guard(arr: any): arr is NominalToken[] {
    return arr[0] instanceof NominalToken
}

function _merge<X extends XPOS>(tokens: NonCompound[], policy: MergePolicy<X>) {
    let token = tokens[0] as NominalToken
    let lemma = policy.lemma(tokens)
    let upos = policy.upos(tokens)
    let xpos = policy.xpos?policy.xpos(tokens):undefined
    let feats = policy.feats(tokens)
    let deps = policy.deps(tokens)
    let misc = policy.misc(tokens)
    let form
    if (nominal_guard(tokens)) {
        let [head, deprel] = policy.headRels(tokens)
        token.head = head
        token.deprel = deprel
        form = tokens.slice(0, -1).map((t) => {
            if (t.misc && t.misc.find((m) => m == "SpaceAfter=No")) {
                return t.form
            } else {
                return t.form + " "
            }
        }).reduce((f, str) => f + str)
        let t = tokens[tokens.length - 1]
        form += t.form
        if (t.misc && !t.misc.find((m) => m == "SpaceAfter=No")) 
            form += " "
    } else {
        let trim_last = false
        let forms = tokens.filter((t) => t.form).map((t) => {
            if (t.misc && t.misc.find((m) => m == "SpaceAfter=No")) {
                trim_last = false
                return t.form
            } else {
                trim_last = true
                return t.form + " "
            }
        })
        if (forms.length > 0) form = forms.reduce((f, str) => str?f + str: f)
        else form = undefined
        if (trim_last) form = form.slice(0, -1)
    }
    token.form = form
    token.lemma = lemma
    token.upos = upos
    token.xpos = xpos
    token.feats = feats
    token.deps = deps
    token.misc = misc
}

/**
 * A merging policy.
 * 
 * It has following attributes:
 * - `headPol` field will determined how all dependants shall be handle. 
 * The default value is `HeadPolicy.Adjust`
 * - `lemma` field is a callback that takes all tokens being merged as argument and return merged lemma. 
 * The default value is every lemma concatenated together or undefined.
 * - `upos` field is a callback that takes all tokens being merged as argument and return merged part-of-speech. 
 * The default value is a part-of-speech of first token being merge.
 * - `xpos` an optional field which is a callback that takes all tokens being merged as argument and return merged language specific part-of-speech. 
 * - `feats` field is a callback that takes all tokens being merged as argument and return merged feature(s).
 * The default value is a flatten merge of all unique features from every tokens being merged.
 * - `headRels` field is a callback that takes all tokens being merged as argument and return merged `head` and `deprel` fields.
 * The default is first token being merged head/deprel field if there's no root `Relation` in merging, otherwise, it
 * will become new root. 
 * - `deps` field is a callback that takes all tokens being merged as argument and return merged `deps` fields.
 * The default is merged of every unique deps field of tokens being merged.
 * - `misc` field is a callback that takes all tokens being merged as argument and return merged `misc` fields.
 * The default value is all unique of flatten map misc fields of every tokens. There's a special
 * treatment for "SpaceAfter=*" value in misc. The merged token will use last mergining token "SpaceAfter"
 * value. If last oken have no such value, the merged token will also have no "SpaceAfter" value.
 */
export class MergePolicy<X extends XPOS> {
    headPol: HeadPolicy = HeadPolicy.Adjust;
    lemma: (tokens: NonCompound[]) => string = (tokens: NonCompound[]) => {
        let trim_last = true
        let lemmas = tokens.filter((t) => t.lemma != null).map((t) => {
            if (t.misc && t.misc.find((m) => m == "SpaceAfter=No")) {
                trim_last = false
                return t.lemma
            } else {
                trim_last = true
                return t.lemma + ' '
            }
        })
        if (lemmas.length > 0) {
            let lemma = lemmas.join('')
            if (trim_last) return lemma.slice(0, -1)
            else return lemma
        }
    };
    upos: (tokens: NonCompound[]) => UPOS = (tokens: NonCompound[]) => tokens[0].upos;
    xpos?: (tokens: NonCompound[]) => X;
    feats: (tokens: NonCompound[]) => Feature[] = (tokens: NonCompound[]) => {
        let feats = tokens.filter((t) => t.feats != null).flatMap((t) => t.feats).filter((v, i, a) => a.indexOf(v) === i)
        if (feats.length > 0) return feats
    }
    headRels: (tokens: NominalToken[]) => [HeadId, Relation] = (tokens: NominalToken[]) => {
        if (tokens.find((t) => t.head == 0)) return [0, new Relation("root")]
        return [tokens[0].head, tokens[0].deprel]
    }
    deps: (tokens: NonCompound[]) => AdvanceDep[] = (tokens: NonCompound[]) => {
        let deps = tokens.filter((t) => t.deps != null).flatMap((t) => t.deps).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => {
            if (a[0] < b[0]) return -1
            else if (a[0] > b[0]) return 1
            else {
                if (a[1] < b[1]) return -1
                else if (a[1] > b[1]) return 1
                else return 0
            }
        })
        if (deps.length > 0) return deps
    };
    misc: (tokens: NonCompound[]) => string[] = (tokens: NonCompound[]) => {
        let misc = Array.from(new Set(tokens.filter((t) => t.misc != undefined).flatMap((t) => t.misc))).filter((m) => !m.startsWith("SpaceAfter="))
        // SpaceAfter need special treatment as it is predefined by CoNLL-U as per
        // https://universaldependencies.org/format.html#untokenized-text
        let last_token = tokens[tokens.length - 1]
        let i = last_token.misc?last_token.misc.findIndex((m) => m.startsWith("SpaceAfter=")):-1
        if (i >= 0) misc.push(last_token.misc[i]) // Copy SpaceAfter from last mergining token
        if (misc.length > 0) return misc
    }
}

/**
 * Define how each property of splitted will be derived.
 * By default, all properties except `form` are copy from original token.
 */
export class SplitPolicy<X extends XPOS> {
    lemma: (token: NonCompound) => string = (token: NonCompound) => token.lemma
    upos: (token: NonCompound) => UPOS = (token: NonCompound) => token.upos;
    xpos?: (token: NonCompound) => X;
    feats: (tokens: NonCompound) => Feature[] = (token: NonCompound) => token.feats
    headRels: (token: NominalToken) => [HeadId, Relation] = (token: NominalToken) => [token.head, token.deprel]
    deps: (token: NonCompound) => AdvanceDep[] = (token: NonCompound) => token.deps
    misc: (token: NonCompound) => string[] = (token: NonCompound) => token.misc
}