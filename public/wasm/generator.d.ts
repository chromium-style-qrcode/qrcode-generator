/* tslint:disable */
/* eslint-disable */
export function generate_qr_code_wasm(input_data: string): QrCodeResult;
export function generate_qr_code_with_options(input_data: string, _module_style: ModuleStyle, _locator_style: LocatorStyle, _center_image: CenterImage, quiet_zone: QuietZone): QrCodeResult;
export enum CenterImage {
  NoCenterImage = 0,
  Dino = 1,
}
export enum LocatorStyle {
  Square = 0,
  Rounded = 1,
}
export enum ModuleStyle {
  Squares = 0,
  Circles = 1,
}
export enum QuietZone {
  Included = 0,
  WillBeAddedByClient = 1,
}
export class QrCodeResult {
  private constructor();
  free(): void;
  data: Uint8Array;
  size: number;
  original_size: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_qrcoderesult_free: (a: number, b: number) => void;
  readonly __wbg_get_qrcoderesult_data: (a: number) => [number, number];
  readonly __wbg_set_qrcoderesult_data: (a: number, b: number, c: number) => void;
  readonly __wbg_get_qrcoderesult_size: (a: number) => number;
  readonly __wbg_set_qrcoderesult_size: (a: number, b: number) => void;
  readonly __wbg_get_qrcoderesult_original_size: (a: number) => number;
  readonly __wbg_set_qrcoderesult_original_size: (a: number, b: number) => void;
  readonly generate_qr_code_wasm: (a: number, b: number) => [number, number, number];
  readonly generate_qr_code_with_options: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number];
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
