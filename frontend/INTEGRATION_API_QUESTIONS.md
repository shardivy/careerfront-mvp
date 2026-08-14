# Integration Guide: Using API Questions Instead of Test Data

## Overview
The system now fetches questions from the backend API instead of using hardcoded test data.

## API Response Structure
```javascript
{
  count: 3,
  next: null,
  previous: null,
  results: {
    success: true,
    subsection_id: 1,
    subsection_name: "Vocabulary",
    questions: [
      {
        id: 1,
        question_text: "Add 32 + 63 + 67 + 47",
        question_image: null,
        options: [
          { id: "A", text: "308" },
          { id: "B", text: "206" },
          { id: "C", text: "209" },
          { id: "D", text: "241" }
        ],
        marks: 1,
        negative_marks: 0,
        question_type: "SINGLE_CHOICE",
        display_order: 1
      },
      // ... more questions
    ]
  }
}
```

## How to Use in Components

### Option 1: Replace Test Data Questions (Simple)
In any assessment runner component:

```javascript
import { useStudentQuestions } from "../hooks/useStudentQuestions";
import { useTestSubsection } from "../hooks/useTestSubsections";

const MyAssessmentRunner = () => {
  const { testType, sectionId } = useParams();
  
  // Get metadata (title, timeLimit, icon, instructions from testData)
  const { section: metadata, loading: metaLoading } = useTestSubsection(testType, sectionId);
  
  // Get actual questions from API using subsection's dbId
  const { questions, loading: questionsLoading } = useStudentQuestions(metadata?.dbId);
  
  const isLoading = metaLoading || questionsLoading || !questions.length;
  
  return (
    // Use questions array in your UI
  );
};
```

### Option 2: Keep Test Data Fallback
If you want to fallback to test data when API is unavailable:

```javascript
const finalQuestions = questions.length > 0 
  ? questions  
  : (metadata?.questions || []);
```

## What Gets Transformed

The `transformApiQuestion` function converts:
- `question_text` → `prompt`
- `options: [{ id, text }]` → `options: [text, text, ...]`
- Keeps original structure in `optionsWithIds` for answer validation
- Adds `questionImage` for image-based questions

## Redux State Structure

**Store path:** `state.studentQuestion`

```javascript
{
  questions: [],          // Transformed questions array
  subsectionId: null,     // Backend subsection ID
  subsectionName: "",     // Subsection name from API
  count: 0,               // Total question count
  loading: false,
  error: null
}
```

## Example Integration: AssessmentRunner

```javascript
const AssessmentRunner = () => {
  const { testType = "aptitude", sectionId } = useParams();
  
  // Metadata from test data
  const { tabs } = useTestSubsections(testType);
  const section = tabs.find((t) => t.id === sectionId);
  
  // Questions from API
  const { questions: apiQuestions, loading: apiLoading } = useStudentQuestions(
    section?.dbId
  );
  
  // Use API questions, fallback to test data
  const questions = apiQuestions.length > 0 ? apiQuestions : (section?.questions || []);
  
  const isLoading = apiLoading || !section;
  
  // Rest of component remains the same
};
```

## Files Updated

1. **studentQuestionSlice.js** - Redux slice for API questions
2. **useStudentQuestions.js** - Hook to fetch & manage questions
3. **questionTransformer.js** - Transforms API response to component format

## Next Steps

1. Update **AssessmentRunner.jsx** to use `useStudentQuestions(section?.dbId)`
2. Update **RapidAssessmentRunner.jsx** similarly
3. Update **InterestAssessmentRunner.jsx** similarly
4. Update **ImageAssessmentRunner.jsx** similarly
5. Optionally remove hardcoded questions from QUESTION_BANKS in testData.js
