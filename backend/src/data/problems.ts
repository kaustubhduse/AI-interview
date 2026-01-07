export interface Problem {
  id: string;
  title: string;
  description: string;
  examples: Array<{ input: string; output: string }>;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  starterCode: string;
  solution: string; // For reference/AI context
}

export const problems: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    difficulty: "Easy",
    starterCode: "function twoSum(nums, target) {\n  // Your code here\n};",
    solution: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n}"
  },
  {
    id: "reverse-string",
    title: "Reverse String",
    description: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
    examples: [
        { input: "s = ['h','e','l','l','o']", output: "['o','l','l','e','h']" }
    ],
    difficulty: "Easy",
    starterCode: "function reverseString(s) {\n  // Your code here\n};",
    solution: "function reverseString(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left++;\n    right--;\n  }\n}"
  },
  {
    id: "valid-palindrome",
    title: "Valid Palindrome",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.",
    examples: [
        { input: "s = 'A man, a plan, a canal: Panama'", output: "true" }
    ],
    difficulty: "Easy",
    starterCode: "function isPalindrome(s) {\n  // Your code here\n};",
    solution: "function isPalindrome(s) {\n  s = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\n  return s === s.split('').reverse().join('');\n}"
  }
];
