class Utils
{
    static sanitizeForURL(str) 
    {
        return str.replace(/[\/\?&=#%\"\'\\:<>\|\^\`\[\]]/g, '');
    }

    /**
     * Computes the range and returns a string in A1 notation (Example: A1:A2)
     * @param {string} column Column of the range
     * @param {number} rowStart  Starting row. 0-indexed. With 0 being row 1 in Sheets
     * @param {number} rowCount Number of rows in the range
     * @returns {string} The range in A1 notation
     */
    static computeRange(column, rowStart, rowCount)
    {
        ++rowStart; //+1 Because it will be converted to str. Meaning row 1 will correspond to precisely the first row in the sheet
        let range = column + rowStart + ':' + column;   //Sample output: A1:A
        return range += Number(rowStart + rowCount - 1);   //-1 because rowStart already counts as one row
    }
}

function binarySearch(arr, toFind, criteria = SEARCH.DEFAULT)
{
    //console.log('START BINARY SEARCH')
    //console.log({arr, toFind})
    let left = 0;
    let right = arr.length - 1;
    let result = 
    {
        isFound: false,
        index: -1,
    }
    let lastMid = -1;

    while (left <= right)
    {
        const mid = Math.floor((left + right) / 2);
        const arrValue = Array.isArray(arr[mid]) ? arr[mid][0] : arr[mid];
        
        lastMid = mid;

        //console.log(mid);
        if (toFind > arrValue)
        {
            //console.log('MORE')
            left = mid + 1;
        }
        else if (toFind < arrValue)
        {
            //console.log('LESS');
            right = mid - 1;
        }
        else
        {
            //console.log('EQUAL')
            result.isFound = true;
            result.index = mid;

            if (criteria === SEARCH.DEFAULT)
            {
                break;
            }
            else if (criteria === SEARCH.FIRST)
            {
                right = mid - 1;
            }
            else if (criteria === SEARCH.LAST)
            {
                left = mid + 1;
            }
            else
            {
                throw new Error('Invalid argument for parameter criteria: ' + criteria);
            }
        }
    }

    result.index = result.isFound ? result.index : lastMid;
    //console.log('RESULT: ', result);
    return result;
}