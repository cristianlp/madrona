dropdb example -U postgres
createdb example -U postgres
rm -rf my_project 

python ../bin/create-madrona-project.py    \
  --project "My Project" \
  --app testapp \
  --domain "hestia.ecotrust.org:8052" \
  --connection "dbname='example' user='postgres' " \
  --studyregion ../../../media/staticmap/data/ca_or_stl.shp \
  --aoi "My Areas"  \
  --aoi "My Other Areas"  \
  --poi "Points of interest"  \
  --loi "Pipelines"  \
  --folder "Folder for Areas"  \
  --kml "Global Marine|http://ebm.nceas.ucsb.edu/GlobalMarine/kml/marine_model.kml" \
  --superuser
