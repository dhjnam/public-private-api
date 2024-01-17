find -f src/test src/routes src/db src \( \
    -regex '.*\.js' -o \
    -regex '.*\.json' -o \
    -regex '.*\.ts' \
\)