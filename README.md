Backend fuctions for the training weak project

To deploy

```firebase deploy``` from the functions folder

To deploy single

```firebase deploy --only functions:functionName``` eg ```firebase deploy --only functions:addWorkout```

Auth issues on deploy

```firebase logout``` then ```firebase login```
or
```firebase --reauth```
