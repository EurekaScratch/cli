/**
 * @fileoverview Extension's declaration .
 * From DangoScratch/editor/packages/dango-vm/extension-support
 */
import ArgumentType from './argument-type';
import BlockType from './block-type';
import ReporterScope from './reporter-scope';
import TargetType from './target-type';
import Cast from '../utils/cast';
import type VM from 'scratch-vm';

/**
 * Technically this can be a translatable object, but in reality it will probably just be
 * a string here.
 */
export type FormattableString = string;

export type ScratchCompatibleValue = string | boolean | number;

/**
 * The environment of the extension.
 */
export type SandboxMode = 'worker' | 'iframe' | 'unsandboxed';

/**
 * Standard Scratch extension class.
 * Based on LLK's example https://github.com/LLK/scratch-vm/blob/develop/docs/extensions.md
 */
export interface ScratchExtensionClass {
    new?: (runtime: VM.Runtime) => void;
    /**
     * Scratch will call this method *once* when the extension loads.
     * This method's job is to tell Scratch things like the extension's ID, name, and what blocks it supports.
     */
    getInfo: () => ExtensionMetadata;
}

declare global {
    var Scratch: ScratchUtils
}

export interface ScratchUtils {
    ArgumentType: ArgumentType;
    /**
     * idk why enum cannot be used here.
     */
    BlockType: Record<keyof typeof BlockType, BlockType>;
    /**
     * idk why enum cannot be used here.
     */
    TargetType: Record<keyof typeof TargetType, BlockType>;
    Cast: Cast;
    extensions: {
        register: (info: ScratchExtensionClass) => Promise<void>;
    }
}
  
 /**
  * All the metadata needed to register an extension.
  */
 export interface ExtensionMetadata {
    /**
     * a unique alphanumeric identifier for this extension. No special characters allowed.
     */
    id: string;
    /**
     * the human-readable name of this extension.
     * Defaults to ID if not specified.
     */
    name?: string;
    showStatusButton?: boolean;
    /**
     * URI for an image to be placed on each block in this extension.
     * Should be a data: URI
     */
    blockIconURI?: string;
    /**
     * URI for an image to be placed on this extension's category menu item.
     * Should be a data: URI
     */
    menuIconURI?: string;
    /**
     * link to documentation content for this extension
     */
    docsURI?: string;
    /**
     * Should be a hex color code.
     */
    color1?: string;
    /**
     * Should be a hex color code.
     */
    color2?: string;
    /**
     * Should be a hex color code.
     */
    color3?: string;
    /**
     * the blocks provided by this extension, plus separators
     */
    blocks: (ExtensionBlockMetadata | string)[];
    /**
     * map of menu name to metadata for each of this extension's menus.
     */
    menus?: Record<string, ExtensionMenu>;
    /**
     * @deprecated only preserved, no practical use
     */
    customFieldTypes?: Record<string, CustomFieldType>;
    /**
     * translation maps
     * @deprecated only exists in documentation, not implemented
     */
    translation_map?: Record<string, Record<string, string>>;
}

export interface ExtensionMenu {
    acceptReporters?: boolean;
    items: MenuItems;
}

/**
 * @deprecated only preserved, no practical use
 */
export interface CustomFieldType {
    extendedName: string;
    implementation: unknown;
}

 /**
  * All the metadata needed to register an extension block.
  */
export interface ExtensionBlockMetadata {
    /**
     * a unique alphanumeric identifier for this block. No special characters allowed.
     */
    opcode: string;
    /**
     * the type of block (command, reporter, etc.) being described.
     */
    blockType: BlockType;
    /**
     * the text on the block, with [PLACEHOLDERS] for arguments.
     */
    text: FormattableString;
    /**
     * URI for an image to be placed on each block in this extension.
     * Should be a data: URI
     * Defaults to ExtensionMetadata's blockIconURI
     */
    blockIconURI?: string;
    /**
     * the name of the function implementing this block. Can be shared by other blocks/opcodes.
     */
    func?: string;
    /**
     * map of argument placeholder to metadata about each arg.
     */
    arguments?: Record<string, ExtensionArgumentMetadata | undefined>;
    /**
     * true if this block should not appear in the block palette.
     */
    hideFromPalette?: boolean;
    /**
     * true if the block ends a stack - no blocks can be connected after it.
     */
    isTerminal?: boolean;
    /**
     * @deprecated use isTerminal instead
     */
    terminal?: boolean;
    /**
     * true if this block is a reporter but should not allow a monitor.
     */
    disableMonitor?: boolean;
    /**
     * if this block is a reporter, this is the scope/context for its value.
     */
    reporterScope?: ReporterScope;
    /**
     * sets whether a hat block is edge-activated.
     */
    isEdgeActivated?: boolean;
    /**
     * sets whether a hat/event block should restart existing threads.
     */
    shouldRestartExistingThreads?: boolean;
    /**
     * for flow control blocks, the number of branches/substacks for this block.
     */
    branchCount?: number;
    /**
     * @deprecated only exists in documentation, not implemented
     */
    blockAllThreads?: boolean;
    /**
     * @deprecated it exists in the source code, but not in the official documentation.
     */
    isDynamic?: boolean;
    /**
     * list of target types for which this block should appear.
     */
    filter?: TargetType[]
  }

export interface ExtensionArgumentMetadata {
    /**
     * the type of the argument (number, string, etc.)
     */
     type: ArgumentType;
     /**
      * the default value of this argument
      */
     defaultValue?: unknown;
     /**
      * the name of the menu to use for this argument, if any.
      */
     menu?: string;
     /**
      * Only available when type is INLINE_IMAGE
      */
     dataURI?: string;
     /**
      * Only available when type is INLINE_IMAGE
      * Whether the image should be flipped horizontally when the editor has a right to left language selected as its locale. By default, the image is not flipped.
      */
     flipRTL?: boolean;
     /**
      * Only available when type is INLINE_IMAGE
      */
     alt?: string;
 }

export type MenuItemFunction = () => {
    text: string;
    value: string;
};

export type MenuItems = Array<MenuItemFunction | {
    text: string;
    value: string;
}>;

export type BlockArgs = Record<string, ScratchCompatibleValue>;