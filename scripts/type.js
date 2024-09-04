class Type
{
    static Question = Object.freeze(
        {
            CORRECT: 'CORRECT',
            PARTIAL: 'PARTIAL',
            WRONG: 'WRONG',
            NEW: 'NEW',
        });
    
    static Input = Object.freeze(
        {
            RADIO: 'radio',
            TEXT: 'text',
        });

    static Color = Object.freeze(
        {
            RED: 'rgb(255, 0, 0)',
            BLACK: 'rgb(51, 51, 51)',
        });
}