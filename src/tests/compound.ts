import {CompoundToken} from '../index'
import {expect} from 'chai'

describe("Test CompoundToken", () => {
    describe("Test toString", () => {
        it("Test minimal CompoundToken", () => {
            let token = new CompoundToken({id: [1, 5], form: "token"})
            expect(token.toString()).to.equal("1-5\ttoken\t_\t_\t_\t_\t_\t_\t_\t_")
        })
        it("Test misc of CompoundToken", () => {
            let token = new CompoundToken({id: [1, 5], form: "token", misc: ["SpaceAfter=Yes", "PhraseLv=1"]})
            expect(token.toString()).to.equal("1-5\ttoken\t_\t_\t_\t_\t_\t_\t_\tSpaceAfter=Yes|PhraseLv=1")
        })
    })
    
    describe("Test parsing", () => {
        describe("Test valid string", () => {
            it("Test parse full token", () => {
                expect(CompoundToken.parse("1-2\tToken\t_\t_\t_\t_\t_\t_\t_\tPhraseLv=1|SpaceAfter=Yes"))
                    .to.eql(new CompoundToken({
                        id: [1, 2],
                        form: "Token", 
                        misc: ["PhraseLv=1", "SpaceAfter=Yes"]
                    }))
            })
            it("Test parse full token", () => {
                expect(CompoundToken.parse("1-2\tToken\t_\t_\t_\t_\t_\t_\t_\t_"))
                    .to.eql(new CompoundToken({
                        id: [1, 2],
                        form: "Token", 
                    }))
            })
        })
        describe("Test invalid string", () => {
            it("Test parse nominal string", () => {
                expect(CompoundToken.parse.bind(CompoundToken, "1\tToken\tADV\t_\t_\t_\t_\t_\t_\t_"))
                    .to.throw("CompoundToken need id to be in format `[start, end]` where `end` > `start")
            })
            it("Test parse bad range string", () => {
                expect(CompoundToken.parse.bind(CompoundToken, "1-1\tToken\tADV\t_\t_\t_\t_\t_\t_\t_"))
                    .to.throw("CompountToken id range must be in `[start, end]` where `end` > `start`")
            })
            it("Test parse floating point id string", () => {
                expect(CompoundToken.parse.bind(CompoundToken, "1-2.1\tToken\tADV\t_\t_\t_\t_\t_\t_\t_"))
                    .to.throw("CompoundToken require both start and end to be integer number")
            })
        })
    })
})