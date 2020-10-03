# conllu-core
A core lib for parses and serializes `.conllu` file.
**conllu** is actually defined as `CoNLL-U`. It's an extension from `CoNLL-X`.
More info on `CoNLL-U` can be found in [here](https://universaldependencies.org/)

`CoNLL-U` is a kind of corpus file format that design to store parts of speech, morphological features, and syntactic dependencies. The dependencies is "content" based, not "function" based. For more explanation, see [here](https://en.wikipedia.org/wiki/Universal_Dependencies#Function_words)

## Minimum requirement
- Node.js version 8 or above
- Any browser that support ES2015 (ES6)

## How to build from source
1. `git clone https://github.com/NattapongSiri/conllu_core.git`
1. `cd conllu_core`
1. `npm install`
1. `npm run build`

## How to use
1. `npm install conllu_core`

There're many classes that will be used during processing conllu.
Most notable are:
1. Document
1. Sentence
1. Meta
1. Comment
1. Token
1. NominalToken
1. CompoundToken
1. EmptyToken

Import necessary object such as `Document` via `import {Document} from 'conllu_core'`.

## Document class
It is entry point on loading/saving CoNLL-U format.

`Document` class provide 4 ways to instantiate the object.
1. Using `new Document(sentences)` where sentences is an array of `Sentence` object.
1. Using `Document.parse(str)` where str is a `string` object contain whole CoNLL-U content.
1. Using `Document.load(path_to_file)` to load CoNLL-U content from file in given path string.
1. Using `Document.read(stream)` to load CoNLL-U content from given stream where stream is an object of `stream.Readable` describe in [Node.js doc](https://nodejs.org/api/stream.html).

Method `parse`, `load`, and `read` take optional `Parser` class which will be used to parse `xpos` field from given str/file/stream. If it is omit, it will skip `xpos` field in the text.

For example, to load conllu from file use `let doc = await Documentload(path_to_file, MyXPOSParserClass)` or `Document.load(path_to_file, MyXPOSParserClass).then((doc) => {/* Do something with a doc */})`.

`Document` class provide 3 ways to serialize the object.
If document is an object of `Document` class:
1. Using `document.toString()` to retrieve a complete CoNLL-U string representation of the document.
1. Using `document.save(path_to_file)` to serialize document as CoNLL-U format to given path string.
1. Using `document.write(stream)` to serialize document as CoNLL-U format into given stream.

For example, to save document into give file `await document.save('/home/me/doc.conllu')`

It is possible to incrementally load CoNLL-U file sentence by sentence instead of parsing the whole file at once.
To do so, use async generator function `sentences`. It takes a `Readable` object and optional `Parser` arguments. For example:
```javascript
let stream = fs.createReadStream('path/to/file')
for await (let sentence of sentences(stream, MyXPOSParser)) {
    // do something with sentence
}
```

## Data access
`Document` contains a field `sentences`. `sentences` is an array of `Sentence` object.

`Sentence` contains two fields.
- `meta` - It is an array that store either `Comment` or `Meta` object
- `tokens` - It is an array that store `Token`

`Comment` contains a field `text` which is a content of comment.
It represent itself in CoNLL-U as a line preceding list of tokens. For example:
```
# This is a comment
1   token1  ...
2   token2  ...
```
The '...' represent all the rest of the fields for token. The line `# This is a comment` is a comment.

The constructor take one string. You can directly access field `text` to read/update a value. For example: `new Comment('This is a comment')`

`Meta` contains two fields.
- `key` - A string that represent a key of meta
- `value` - A value of given key

It represent itself in CoNLL-U as a line preceding list of tokens similar to `Comment` but in a key/value pair fasion. For example:
```
# sentence = This is a text
1   This    ...
2   is  ...
3   a   ...
4   text    ....
```
The '...' represent all the rest of the fields for token.
The line `# sentence = This is a text`  is a key value pair where key is `sentence` and value is `This is a text`.

The constructor take an object with fields `key` and `value`. Both of them must be string. For example: `new Meta({key: 'sentence', value: 'This is a text'})`. 

`Token` is an abstract class represent a token. There's 3 concrete class for 3 type of tokens.
1. `NominalToken` is the most common token. It contains 9 fields to represent 10 columns of CoNLL-U format.
1. `CompoundToken` is a basic compound type of token. It have 3 fields to represent 10 columns of CoNLL-U format.
1. `EmptyToken` is an advance type of token. It is part of advance dependencies. It has 7 fields to represent 10 columns of CoNLL-U format.

`NominalToken` have 9 fields:
1. `form` - A surface form of type `string`
1. `lemma` - A lemma form of type `string` of current token
1. `upos` - A standard part-of-speech of type `UPOS` enum.
1. `xpos` - A language specific part-of-speech of class `XPOS`. Each language should have it own concrete class extends `XPOS` class.
1. `feats` - An array features of class `Feature`. It is a kind of `key` and `value` pair.
1. `head` - A `number` that reference to existing token by index.
1. `deprel` - A type of relation for field `head`. It must be an instance of `Relation` class.
1. `deps` - is a tuple of `id` value and `DepsRelation` object. `id` can be either `[number]` or `[number, number]`
1. `misc` - is an array of `string`

The constructor take a JSON object with 8 keys. It is similar to fields of `NominalToken` except that it merge `head` and `deprel` into one field call `headRel`. The type of `headRel` is tuple of `number` and `Relation`. All other fields are the same as fields describe above. For example: `new NominalToken({form: 'word', lemma: 'root', upos: UPOS.NOUN, xpos: new LanguageSpecificXPOS('NN'), feats: [new Feature('Gender', ['Neut'])], headRel: [2, new Relation("conj")], deps: [[2], new DepsRelation('conj')], misc=['SpaceAfter=No']})`.
Only `form`, `lemma`, and `upos` is mandatory field in JSON object. All other fields are optional.

`CompoundToken` have 3 fields:
1. `id` - is a tuple of two integer referring to id of `NominalToken`
1. `form` - is a surface form for this compound token.
1. `misc` - is an array of `string`

The constructor also take JSON object with 3 fields similar to field of the class. `misc` is an optional field.

`EmptyToken` have 7 fields:
1. `form` - A surface form of type `string`
1. `lemma` - A lemma form of type `string` of current token
1. `upos` - A standard part-of-speech of type `UPOS` enum.
1. `xpos` - A language specific part-of-speech of class `XPOS`. Each language should have it own concrete class extends `XPOS` class.
1. `feats` - An array features of class `Feature`. It is a kind of `key` and `value` pair.
1. `deps` - is a tuple of `id` value and `DepsRelation` object. `id` can be either `[number]` or `[number, number]`
1. `misc` - is an array of `string`

It is almost identical to `NominalToken` except that `head` and `deprel` are missing.
The constructor thus similar to `NominalToken` except field `headRel` is missing. The major different between `EmptyToken` and `NominalToken` is that the only mandatory field for `EmptyToken` is `deps`. All other fields are optional. It is valid to construct `new EmptyToken({deps: [[0, 1], new DepsRelation('conj)]})`.

`UPOS` is an enum. It contains all valid value for field `UPOS`. For more information visit [here](https://universaldependencies.org/u/pos/index.html)

`XPOS` is an abstract class that any particular language which use `xpos` field need to create a class that inherit `XPS`. Read [here](https://universaldependencies.org/format.html#morphological-annotation) for more info. There's two mandatory methods:
1. toUPOS() which must return a `UPOS` that this `XPOS` is mapped to.
1. toString() which must return a `CoNLL-U` string representation of this POS.

`Feature` is a class that describe morphological feature of this token. It is describe in [here](https://universaldependencies.org/format.html#morphological-annotation). It have 2 fields:
1. name - A string which is name of feature type
1. value - An array of string which is the name of feature value

The constructor take 2 arguments, name and value. It is exactly the same as fields of the class.

`Relation` is a class that describe the token relation to it head. There is only one field `rel` in this class.
The constructor take exactly one string argument which is the name of its' relation.
See [here](https://universaldependencies.org/format.html#syntactic-annotation) for more info.

`DepsRelation` is almost exactly the same as `Relation`. The only different is the name pattern allow to be used. It has one field similar to `Relation` call `rel`. The constructor take exactly one string argument which is the name of its' relation. See [here](https://universaldependencies.org/format.html#syntactic-annotation) and [here](https://universaldependencies.org/u/overview/enhanced-syntax.html) for more details.

`XPOSParser` is an abstract class that have method `parse`. All language specific part-of-speech (XPOS) will need to have an concrete class that inherit this `XPOSParser` with **static** method `parse(string)` that return a concrete implementation of `XPOS` abstract class.

Every constructor will try to validate itself against necessary rules defined somewhere in (UD websites)[https://universaldependencies.org/]. However, dependencies require other object to properly validate it. User need to call `validate` method on `Document` or `Sentence` object to validate the dependencies. Otherwise, dependencies may point to invalid `head`. 

All `toString` method will return `CoNLL-U` string representation of it own unit. For example: calling `toString` on UPOS will return a name such as `"Noun"`. If you call `toString` on `NominalToken` or `EmptyToken`, it will return something like `"form\tlemma\tupos\txpos\tfeature\tthead\tdeprel\tdeps\tmisc"`. It will __not__ have `id` nor `'\u000a'` at the end of string. If you call `toString` on `CompoundToken`, it will return id as well because `CompoundToken` rely on fixed token `id`. It will return something like `"id-id\tform\tlemma\tupos\txpos\tfeature\tthead\tdeprel\tdeps\tmisc"`. Notice that it still have no `\u000a` at the end of string. This is because the `id` of `NominalToken` and `EmptyToken` rely on it position in sentence. It cannot know by itself which `id` it has. However, calling `toString` on `Document` or `Sentence` will get a string that is a complete `CoNLL-U` sentence(s). For example:
`Sentence` may return following string:
```
# sent_id = 1
# text = They buy and sell books.
1   They     they    PRON    PRP    Case=Nom|Number=Plur               2   nsubj   2:nsubj|4:nsubj   _
2   buy      buy     VERB    VBP    Number=Plur|Person=3|Tense=Pres    0   root    0:root            _
3   and      and     CONJ    CC     _                                  4   cc      4:cc              _
4   sell     sell    VERB    VBP    Number=Plur|Person=3|Tense=Pres    2   conj    0:root|2:conj     _
5   books    book    NOUN    NNS    Number=Plur                        2   obj     2:obj|4:obj       SpaceAfter=No
6   .        .       PUNCT   .      _                                  2   punct   2:punct           _
```
Notice that last line will have no `\u000a`.
`Document` may return following string:
```
# sent_id = 1
# text = They buy and sell books.
1   They     they    PRON    PRP    Case=Nom|Number=Plur               2   nsubj   2:nsubj|4:nsubj   _
2   buy      buy     VERB    VBP    Number=Plur|Person=3|Tense=Pres    0   root    0:root            _
3   and      and     CONJ    CC     _                                  4   cc      4:cc              _
4   sell     sell    VERB    VBP    Number=Plur|Person=3|Tense=Pres    2   conj    0:root|2:conj     _
5   books    book    NOUN    NNS    Number=Plur                        2   obj     2:obj|4:obj       SpaceAfter=No
6   .        .       PUNCT   .      _                                  2   punct   2:punct           _

# sent_id = 2
# text = I have no clue.
1   I       I       PRON    PRP   Case=Nom|Number=Sing|Person=1     2   nsubj   _   _
2   have    have    VERB    VBP   Number=Sing|Person=1|Tense=Pres   0   root    _   _
3   no      no      DET     DT    PronType=Neg                      4   det     _   _
4   clue    clue    NOUN    NN    Number=Sing                       2   obj     _   SpaceAfter=No
5   .       .       PUNCT   .     _                                 2   punct   _   _
```
Notice that there's one empty line between two sentences but last line of document will have no `\u000a`.

In any case, if you parse a text with `XPOS` field but supply no implementation of `XPOSParer` concrete class, it will ignore `xpos` field. 