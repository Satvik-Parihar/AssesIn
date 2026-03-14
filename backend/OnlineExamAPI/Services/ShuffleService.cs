using OnlineExamAPI.Models;

namespace OnlineExamAPI.Services;

public static class ShuffleService
{
    /// <summary>
    /// Fisher-Yates shuffle algorithm — produces a new shuffled list without modifying the original.
    /// </summary>
    public static List<T> FisherYatesShuffle<T>(IList<T> source, Random? random = null)
    {
        var rng = random ?? new Random();
        var list = new List<T>(source);
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = rng.Next(0, i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
        return list;
    }
}
