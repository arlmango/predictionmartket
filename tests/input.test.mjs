import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAmount} from '../src/input.mjs';
test('converts six decimal units',()=>{assert.equal(parseAmount('5'),5000000);assert.equal(parseAmount('0.000001'),1);assert.equal(parseAmount('1.123456'),1123456);});
test('rejects invalid trades',()=>{for(const v of ['0','-1','NaN','Infinity','1e2','0.0000001','101',''])assert.throws(()=>parseAmount(v));});
