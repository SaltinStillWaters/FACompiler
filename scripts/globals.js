const SPREADSHEET_ID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';
const G_KEYS = ['currURL', 'FANumber', 'courseID', 'FAID', 'questionID'];

/**
 * Absolute starting row in sheets that contains the first data. 0-indexed
 * @type {?Number}
 */
const G_ROW_START = 1;

const G_INFO_SHEET =
{
    name: 'Info',
    rowCountCell: 'E1',
    tableColumn: 'A',
    tableValues: null,
}

let G_URL_INFO = null;

let QnA =
{
    questionStatus: null,
    question: null,
    inputType: null,
    choices: null,
    wrongs: null,
    prevAnswer: null,
}

const G_DELIMITER = '**EOF**';

const SEARCH = Object.freeze(
{
    DEFAULT: 0,
    FIRST: 1,
    LAST: 2,
});