class Utils
{
    static sanitizeForURL(str) 
    {
        return str.replace(/[\/\?&=#%\"\'\\:<>\|\^\`\[\]]/g, '');
    }

    static computeRange(column, rowStart, rowCount)
    {
        let range = column + rowStart + ':' + column;   //Sample output: A1:A
        return range += Number(rowStart + rowCount - 1);   //-1 because rowStart already counts as one row
    }
}

function binarySearch(arr, toFind, criteria = SEARCH.DEFAULT)
{
    let left = 0;
    let right = arr.length - 1;
    let result = 
    {
        isFound: false,
        lastMid: -1,
    }
    
    while (left <= right)
    {
        const mid = Math.floor((left + right) / 2);
        const arrValue = Array.isArray(arr[mid]) ? arr[mid][0] : arr[mid];
        
        console.log({toFind, arrValue});
        
        result.lastMid = mid;

        if (toFind > arrValue)
        {
            left = mid + 1;
        }
        else if (toFind < arrValue)
        {
            right = mid - 1;
        }
        else
        {
            result.isFound = true;

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

    return result;
}