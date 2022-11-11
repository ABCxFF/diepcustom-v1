/*
    DiepCustom - custom tank game server that shares diep.io's WebSocket protocol
    Copyright (C) 2022 ABCxFF (github.com/ABCxFF)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program. If not, see <https://www.gnu.org/licenses/>
*/

import { writtenBufferChunkSize } from "../config";

/**
 * UNDOCUMENTED FILE
 **/
// TODO(ABC):
// Code a compressor (The previous was not OOP and used lz4js code)
// If this code gets out of bounds (only happens if you play around with dev too much), the server crashes [better than out of bounds r/w].
// 
// TEMP FIX - 2022/11/11:
//   OUTPUT_BUFFER now gets resized if running out of space for the packet
let OUTPUT_BUFFER = Buffer.alloc(writtenBufferChunkSize);

const convo = new ArrayBuffer(4);
const i32 = new Int32Array(convo);
const f32 = new Float32Array(convo);

const Encoder: TextEncoder = new TextEncoder();

const endianSwap = (num: number) =>
    ((num & 0xff) << 24) |
    ((num & 0xff00) << 8) |
    ((num >> 8) & 0xff00) |
    ((num >> 24) & 0xff);

export default class Writer {
    private _at: number = 0;

    private get at() {
        return this._at;
    }

    private set at(v) {
        this._at = v;

        if (OUTPUT_BUFFER.length <= this._at + 5) {
            const newBuffer = Buffer.alloc(OUTPUT_BUFFER.length + writtenBufferChunkSize);
            newBuffer.set(OUTPUT_BUFFER, 0);

            OUTPUT_BUFFER = newBuffer;
        }
    }

    public u8(val: number) {
        OUTPUT_BUFFER.writeUInt8(val >>> 0 & 0xFF, this.at++);
        return this;
    }
    public u16(val: number) {
        OUTPUT_BUFFER.writeUint16LE(val >>> 0 & 0xFFFF, (this.at += 2) - 2);
        return this;
    }
    public u32(val: number) {
        OUTPUT_BUFFER.writeUint32LE(val >>> 0, (this.at += 4) - 4);
        return this;
    }
    public float(val: number) {
        OUTPUT_BUFFER.writeFloatLE(val, (this.at += 4) - 4);
        return this;
    }
    public vf(val: number) {
        f32[0] = val;

        return this.vi(endianSwap(i32[0]));
    }
    public vu(val: number) {
        val |= 0;

        do {
            let part = val;
            val >>>= 7;
            if (val) part |= 0x80;
            OUTPUT_BUFFER.writeUint8(part >>> 0 & 0xFF, this.at++);
        } while (val);

        // OUTPUT_BUFFER.set(buf.subarray(0, at), (this.at += at) - at);
        return this;
    }
    public vi(val: number) {
        val |= 0;
        return this.vu((0 - (val < 0 ? 1 : 0)) ^ (val << 1)); // varsint trick
    }
    public bytes(buffer: Uint8Array) {
        OUTPUT_BUFFER.set(buffer, (this.at += buffer.byteLength) - buffer.byteLength)
        return this;
    }
    public raw(...data: number[]) {
        OUTPUT_BUFFER.set(data, (this.at += data.length) - data.length)
        return this;
    }
    public radians(radians: number) {
        return this.vi(radians * 64)
    }
    public degrees(degrees: number) {
        degrees *= Math.PI / 180
        return this.vi(degrees * 64)
    }
    public stringNT(str: string) {
        this.at += Encoder.encodeInto(str + "\x00", OUTPUT_BUFFER.subarray(this.at)).written || 0;

        return this;
    }
    public entid(entity: null | {hash: number, id: number}) {
        if (!entity || entity.hash === 0) return this.u8(0);
        return this.vu(entity.hash).vu(entity.id);
    }
    public write(slice: boolean=false) {
        if (slice) return OUTPUT_BUFFER.slice(0, this.at);
        
        return OUTPUT_BUFFER.subarray(0, this.at);
    }
}