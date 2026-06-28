import { createElement } from 'react';

/**
 * @typedef {object} MarkdownProps
 * @property {string} [content]
 * @property {string|import('react').ComponentType} [link]
 */

const renderInline = (text, keyPrefix, Link) => {
	const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
	return parts.filter(Boolean).map((part, index) => {
		if (part.startsWith('`') && part.endsWith('`')) {
			return createElement('code', {key: `${keyPrefix}-code-${index}`}, part.slice(1, -1));
		}

		if (part.startsWith('**') && part.endsWith('**')) {
			return createElement('strong', {key: `${keyPrefix}-strong-${index}`}, part.slice(2, -2));
		}

		const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
		if (linkMatch) {
			return createElement(Link, {
				key: `${keyPrefix}-link-${index}`,
				href: linkMatch[2],
			}, linkMatch[1]);
		}

		return part;
	});
};

const splitTableRow = (line) => {
	const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
	return trimmed.split('|').map(cell => cell.trim());
};

const parseTableAlignment = (cell) => {
	const trimmed = cell.trim();
	const left = trimmed.startsWith(':');
	const right = trimmed.endsWith(':');

	if (left && right) return 'center';
	if (right) return 'right';
	if (left) return 'left';
	return null;
};

const isTableSeparatorRow = (line) => {
	if (!line.includes('|')) return false;

	const cells = splitTableRow(line);
	return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()));
};

const isTableStart = (line, nextLine) => (
	line.includes('|') &&
	Boolean(nextLine) &&
	isTableSeparatorRow(nextLine)
);

const renderTable = (tableLines, index, Link) => {
	const headerCells = splitTableRow(tableLines[0]);
	const alignments = splitTableRow(tableLines[1]).map(parseTableAlignment);
	const bodyRows = tableLines.slice(2).map(splitTableRow);
	const cellStyle = (cellIndex) => {
		const textAlign = alignments[cellIndex];
		return textAlign ? {textAlign} : undefined;
	};

	return createElement('table', {key: `table-${index}`},
		createElement('thead', {key: `table-${index}-head`},
			createElement('tr', {key: `table-${index}-head-row`},
				headerCells.map((cell, cellIndex) => createElement('th', {
					key: `table-${index}-head-cell-${cellIndex}`,
					style: cellStyle(cellIndex),
				}, renderInline(cell, `table-${index}-head-${cellIndex}`, Link))),
			),
		),
		createElement('tbody', {key: `table-${index}-body`},
			bodyRows.map((row, rowIndex) => createElement('tr', {
				key: `table-${index}-row-${rowIndex}`,
			}, headerCells.map((_, cellIndex) => createElement('td', {
				key: `table-${index}-row-${rowIndex}-cell-${cellIndex}`,
				style: cellStyle(cellIndex),
			}, renderInline(row[cellIndex] || '', `table-${index}-row-${rowIndex}-cell-${cellIndex}`, Link))))),
		),
	);
};

/** @param {MarkdownProps} props */
export const Markdown = ({content, link: Link = 'a'}) => {
	if (!content) return null;

	const lines = content.split('\n');
	const elements = [];

	let currentUnorderedListItems = [];
	let currentOrderedListItems = [];
	let codeBlockLines = null;

	const pushCurrentLists = (index) => {
		if (currentUnorderedListItems.length > 0) {
			elements.push(createElement('ul', {key: `ul-${index}`}, currentUnorderedListItems));
			currentUnorderedListItems = [];
		}

		if (currentOrderedListItems.length > 0) {
			elements.push(createElement('ol', {key: `ol-${index}`}, currentOrderedListItems));
			currentOrderedListItems = [];
		}
	};

	const pushCodeBlock = (index) => {
		if (codeBlockLines !== null) {
			elements.push(
				createElement('pre', {key: `code-${index}`}, codeBlockLines.join('\n')),
			);
			codeBlockLines = null;
		}
	};

	const isSeparator = (line) => {
		const trimmed = line.trim();
		return (
			trimmed === '<hr>' ||
			trimmed === '<hr/>' ||
			trimmed === '<hr />' ||
			/^(\*\s*){3,}$/.test(trimmed) ||
			/^(-\s*){3,}$/.test(trimmed) ||
			/^(_\s*){3,}$/.test(trimmed)
		);
	};

	const orderedListMatch = line => line.match(/^(\d+)\.\s+(.*)$/);

	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const key = `${index}-${line}`;
		const twoLinesBack = index > 1 ? lines[index - 2] : null;
		const previousLine = index > 0 ? lines[index - 1] : null;
		const nextLine = index < lines.length - 1 ? lines[index + 1] : null;
		if (line.startsWith('```')) {
			pushCurrentLists(index);
			if (codeBlockLines === null) {
				codeBlockLines = [];
			} else {
				pushCodeBlock(index);
			}
		} else if (codeBlockLines !== null) {
			codeBlockLines.push(line);
		} else if (line.startsWith('# ')) {
			pushCurrentLists(index);
			elements.push(createElement('h1', {'key': key}, renderInline(line.slice(2), key, Link)));
		} else if (line.startsWith('## ')) {
			pushCurrentLists(index);
			elements.push(createElement('h2', {'key': key}, renderInline(line.slice(3), key, Link)));
		} else if (line.startsWith('### ')) {
			pushCurrentLists(index);
			elements.push(createElement('h3', {'key': key}, renderInline(line.slice(4), key, Link)));
		} else if (line.startsWith('#### ')) {
			pushCurrentLists(index);
			elements.push(createElement('h4', {'key': key}, renderInline(line.slice(5), key, Link)));
		} else if (isSeparator(line)) {
			pushCurrentLists(index);
			elements.push(createElement('hr', {'key': key}));
		} else if (line.startsWith('- ')) {
			if (currentOrderedListItems.length > 0) {
				pushCurrentLists(index);
			}
			currentUnorderedListItems.push(createElement('li', {'key': key}, renderInline(line.slice(2), key, Link)));
		} else if (orderedListMatch(line)) {
			if (currentUnorderedListItems.length > 0) {
				pushCurrentLists(index);
			}
			const match = orderedListMatch(line);
			currentOrderedListItems.push(createElement('li', {'key': key}, renderInline(match[2], key, Link)));
		} else if (isTableStart(line, nextLine)) {
			pushCurrentLists(index);
			const tableLines = [line, nextLine];
			index += 2;

			while (index < lines.length && lines[index].trim() !== '' && lines[index].includes('|')) {
				tableLines.push(lines[index]);
				index++;
			}

			index--;
			elements.push(renderTable(tableLines, index, Link));
		} else if (line.trim() === '') {
			pushCurrentLists(index);
			const twoBackIsBlank = (twoLinesBack || '').trim() === '';
			const previousIsBlank = (previousLine || '').trim() === '';
			if (
				!twoBackIsBlank &&
				previousIsBlank &&
				!isSeparator(previousLine || '') &&
				!isSeparator(nextLine || '')
			) {
				elements.push(createElement('br', {'key': key}));
			}
		} else {
			pushCurrentLists(index);
			elements.push(createElement('p', {'key': key}, renderInline(line, key, Link)));
		}
	}

	pushCurrentLists(lines.length);
	pushCodeBlock(lines.length);

	return elements;
};
