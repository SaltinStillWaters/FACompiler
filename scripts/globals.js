const G_KEYS = ['currURL', 'FANumber', 'courseID', 'FAID', 'questionID'];
const SPREADSHEET_ID = '1Nt9_t6cTjv-J7Ej9q-b9NK8aETeB0OxEkr4eFGz_D4I';

const G_INFO_SHEET =
{
    name: 'Info',
    rowCountCell: 'e1',
    tableRange: 'a2:a2',
    rowCount: undefined,
    tableValues: undefined,
}

let G_URL_INFO = undefined;

const QnA =
{
    question: undefined,
    questionStatus: undefined,
    tickedButton: undefined,
    questionType: undefined,
    choices: undefined,
}

const SEARCH = Object.freeze(
{
    DEFAULT: 0,
    FIRST: 1,
    LAST: 2,
});