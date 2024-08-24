class Utils
{
    static sanitizeForURL(str) 
    {
        return str.replace(/[\/\?&=#%\"\'\\:<>\|\^\`\[\]]/g, '');
    }
}