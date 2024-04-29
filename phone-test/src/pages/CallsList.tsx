import { useQuery } from '@apollo/client';
import styled from 'styled-components';
import { PAGINATED_CALLS } from '../gql/queries';
import {
  Grid,
  Icon,
  Typography,
  Spacer,
  Box,
  DiagonalDownOutlined,
  DiagonalUpOutlined,
  Pagination,
  Select
} from '@aircall/tractor';
import { formatDate, formatDuration, getValidDate } from '../helpers/dates';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { da } from 'date-fns/locale';

export const PaginationWrapper = styled.div`
  > div {
    width: inherit;
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
`;

export const FilterWrapper = styled.div`
  width: inherit;
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;

const CALLS_PER_PAGE = 5;

// pageSizeOptions?: {
//   value: number;
//   label: string;
// }[];

const optionPageSize = [{
  value: 25,
  label: '25',
},
{
  value: 50,
  label: '50',
},
{
  value: 100,
  label: '100',
},
{
  value: 200,
  label: '200',
},
];

const optionDirectionFilter = [{
  value: 'outbound',
  label: 'Outbound',
}, {
  value: 'inbound',
  label: 'Inbound',
}];

const optionTypeFilter = [
  {
    value: 'missed',
    label: 'Missed call',
  }, {
    value: 'answered',
    label: 'Answered',
  }, {
    value: 'voicemail',
    label: 'Voicemail',
  }
]

export const CallsListPage = () => {
  const [resultsPerPage, setResultsPerPage] = useState(25);
  const [search, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const pageQueryParams = search.get('page');
  const directionFilter = search.get('direction');
  const typeFilter = search.get('type');

  const isListFiltered = !!directionFilter || !!typeFilter;

  const activePage = !!pageQueryParams ? parseInt(pageQueryParams) : 1;
  const { loading, error, data } = useQuery(PAGINATED_CALLS, {
    variables: {
      offset: (activePage - 1) * resultsPerPage,
      limit: resultsPerPage
    }
    // onCompleted: () => handleRefreshToken(),
  });

  if (loading) return <p>Loading calls...</p>;
  if (error) return <p>ERROR</p>;
  if (!data) return <p>Not found</p>;

  const handleFilterChange = (category: string, filterValue: string) => {
    setSearchParams((prev) => {
      if (!!filterValue) {
        prev.set(category, filterValue)
      } else {
        prev.delete(category)
      }

      return prev
    })
  };


  const handlePageSize = (pageSize: any) => {
    console.log(pageSize);
    setResultsPerPage(pageSize);
  };

  const { totalCount, nodes: calls } = data.paginatedCalls;

  const sortCallsList = [...calls].sort((a: Call, b: Call) => {
    const dateA = getValidDate(a.created_at).getTime();
    const dateB = getValidDate(b.created_at).getTime();

    return dateB - dateA;
  });

  const filteredList = isListFiltered ? sortCallsList.filter((call: Call) => {
    let hasDirectionFilter = true;
    let hasTypeFilter = true;

    if (!!directionFilter) {
      hasDirectionFilter = call.direction === directionFilter;
    }
    if (!!typeFilter) {
      hasTypeFilter = call.call_type === typeFilter;
    }

    return hasDirectionFilter && hasTypeFilter;

  }) : sortCallsList;

  const handleCallOnClick = (callId: string) => {
    navigate(`/calls/${callId}`);
  };

  const handlePageChange = (page: number) => {
    navigate(`/calls/?page=${page}`);
  };

  type CallDictionary = {
    [date: string]: Call[]
  }

  const getGroupedItems = () =>
    filteredList.reduce((acc: CallDictionary, item: any) => {
      const date: string = formatDate(item.created_at, 'LLL d');
      if (!acc.hasOwnProperty(date)) {
        acc[date] = [];
      }

      acc[date].push(item);
      return acc;
    }, {});

  const groupedBy: CallDictionary = getGroupedItems();
  
  return (
    <>
      <Typography variant="displayM" textAlign="center" py={3}>
        Calls History
      </Typography>
      <FilterWrapper>
        <Select
          placeholder='Choose one option'
          options={optionDirectionFilter}
          onSelectionChange={(currentSelectedKeys) => {
            // console.log(currentSelectedKeys);
            handleFilterChange('direction', currentSelectedKeys[0] as string)
          }}
        />
        <Select
          placeholder='Choose one option'
          options={optionTypeFilter}
          onSelectionChange={(currentSelectedKeys) => {
            // console.log(currentSelectedKeys);
            handleFilterChange('type', currentSelectedKeys[0] as string)
          }}
        />
      </FilterWrapper>
      <Spacer space={3} direction="vertical">

        {groupedBy && (
          Object.keys(groupedBy).map((item: any) => {
            return (
              <div >
                <h1>{item}</h1>
                {groupedBy[item].map((call: Call) => {
                  const icon = call.direction === 'inbound' ? DiagonalDownOutlined : DiagonalUpOutlined;
                  const title =
                    call.call_type === 'missed'
                      ? 'Missed call'
                      : call.call_type === 'answered'
                        ? 'Call answered'
                        : 'Voicemail';
                  const subtitle = call.direction === 'inbound' ? `from ${call.from}` : `to ${call.to}`;
                  const duration = formatDuration(call.duration / 1000);
                  const date = formatDate(call.created_at);
                  const notes = call.notes ? `Call has ${call.notes.length} notes` : <></>;

                  return (
                    <Box
                      key={call.id}
                      bg="black-a30"
                      borderRadius={16}
                      cursor="pointer"
                      onClick={() => handleCallOnClick(call.id)}
                    >
                      <Grid
                        gridTemplateColumns="32px 1fr max-content"
                        columnGap={2}
                        borderBottom="1px solid"
                        borderBottomColor="neutral-700"
                        alignItems="center"
                        px={4}
                        py={2}
                      >
                        <Box>
                          <Icon component={icon} size={32} />
                        </Box>
                        <Box>
                          <Typography variant="body">{title}</Typography>
                          <Typography variant="body2">{subtitle}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" textAlign="right">
                            {duration}
                          </Typography>
                          <Typography variant="caption">{date}</Typography>
                        </Box>
                      </Grid>
                      <Box px={4} py={2}>
                        <Typography variant="caption">{notes}</Typography>
                      </Box>
                    </Box>
                  );
                })
                }
              </div>
            )
          })
        )}

        {/* {groupedBy && (
          Object.keys(groupedBy).sort().map((item) => {
            return (
              <div>
                <<h1>{item}</h1>
                
              </div>
      );

          })
        )} */}
      </Spacer >

      {totalCount && (
        <PaginationWrapper>
          <Pagination
            activePage={activePage}
            pageSize={resultsPerPage}
            onPageChange={handlePageChange}
            pageSizeOptions={optionPageSize}
            onPageSizeChange={handlePageSize}
            recordsTotalCount={totalCount}
          />
        </PaginationWrapper>
      )
      }
    </>
  );
};
