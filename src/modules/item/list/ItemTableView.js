import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { itemService } from '../itemService';
import { itemPayload } from '../itemPayload';
import { DataTable } from 'primereact/datatable';
import { auditColumns, paginateOptions } from '../../../constants/config';
import { PaginatorRight } from '../../../shares/PaginatorRight';
import { Column } from 'primereact/column';
import { Status } from '../../../shares/Status';
import { paths } from '../../../constants/paths';
import { datetime } from '../../../helpers/datetime';
import { Search } from '../../../shares/Search';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';
import { setPaginate } from '../itemSlice';
import { getRequest } from '../../../helpers/api';
import { setDateFilter, setStatusFilter } from '../../../shares/shareSlice';
import { FilterByStatus } from '../../../shares/FilterByStatus';
import { endpoints } from '../../../constants/endpoints';
import { FilterByDate } from '../../../shares/FilterByDate';
import moment from 'moment';
import { Card } from 'primereact/card';
import { NavigateId } from '../../../shares/NavigateId';
import { ExportExcel } from "../../../shares/export";
import { ImportExcel } from '../../../shares/import';
import { Avatar } from 'primereact/avatar';

const ItemTableView = () => {

    const dispatch = useDispatch();
    const { items, paginateParams } = useSelector(state => state.item);
    const { translate } = useSelector(state => state.setting);

    const [loading, setLoading] = useState(false);
    const [showAuditColumn, setShowAuditColumn] = useState(false);

    const first = useRef(0);
    const total = useRef(0);
    const itemStatus = useRef(['ALL']);
    const columns = useRef(itemPayload.columns);
    const showColumns = useRef(columns.current.filter(col => col.show === true));

    /**
     * Event - Paginate Page Change
     * @param {*} event 
     */
    const onPageChange = (event) => {
        first.current = event.page * paginateParams.per_page;
        dispatch(
            setPaginate({
                ...paginateParams,
                page: event?.page + 1,
                per_page: event?.rows,
            })
        );
    };

    /**
     * Event - Search
     * @param {*} event 
     */
    const onSearchChange = (event) => {
        dispatch(
            setPaginate({
                ...paginateParams,
                search: event,
            })
        );
    };

    /**
     * Event - Column sorting "DESC | ASC"
     * @param {*} event 
     */
    const onSort = (event) => {
        const sortOrder = event.sortOrder === 1 ? "DESC" : "ASC";
        console.log(event);
        dispatch(
            setPaginate({
                ...paginateParams,
                sort: sortOrder,
                order: event.sortField
            })
        );
    }

    /**
    * On Change Filter
    * @param {*} e
    */
    const onFilter = (e) => {
        let updatePaginateParams = { ...paginateParams };

        if (e === "ALL") {
            updatePaginateParams.filter = "";
            updatePaginateParams.value = "";
        } else {
            updatePaginateParams.filter = "status";
            updatePaginateParams.value = e;
        }

        dispatch(setPaginate(updatePaginateParams));
        dispatch(setStatusFilter(e));
    };

    const onFilterByDate = (e) => {
        let updatePaginateParams = { ...paginateParams };

        if (e.startDate === "" || e.endDate === "") {
            delete updatePaginateParams.start_date;
            delete updatePaginateParams.end_date;
        } else {
            updatePaginateParams.start_date = moment(e.startDate).format("yy-MM-DD");
            updatePaginateParams.end_date = moment(e.endDate).format("yy-MM-DD");
        }

        dispatch(setDateFilter(e));
        dispatch(setPaginate(updatePaginateParams));
    };

    /**
     *  Loading Data
     */
    const loadingData = useCallback(async () => {
        setLoading(true);

        const result = await itemService.index(dispatch, paginateParams);
        if (result.status === 200) {
            total.current = result?.data?.total ? result.data.total : result.data.length;
        }

        setLoading(false);
    }, [dispatch, paginateParams]);

    /**
    * loading general Status
    */
    const loadingStatus = useCallback(async () => {
        const itemStatusResponse = await getRequest(
            `${endpoints.status}?type=general`
        );

        if (itemStatusResponse.status === 200) {
            itemStatus.current = itemStatus.current.concat(
                itemStatusResponse.data.general
            );
        }
    }, []);

    useEffect(() => {
        loadingStatus();
    }, [loadingStatus]);

    useEffect(() => {
        loadingData();
    }, [loadingData])

    /**
     * Table Footer Render
     * **/
    const FooterRender = () => {
        return (
            <div className=' flex items-center justify-content-between'>
                <div>{translate.total} - <span style={{ color: "#4338CA" }}> {total.current > 0 ? total.current : 0}</span></div>
                <div className=' flex align-items-center gap-3'>
                    <Button
                        outlined
                        icon="pi pi-refresh"
                        size="small"
                        onClick={() => {
                            dispatch(setPaginate(itemPayload.paginateParams));
                            dispatch(setStatusFilter("ALL"));
                            dispatch(setDateFilter({ startDate: "", endDate: "" }));
                        }}
                    />
                    <PaginatorRight
                        show={showAuditColumn}
                        onHandler={(e) => setShowAuditColumn(e)}
                        label={translate.audit_columns}
                    />
                </div>
            </div>
        )
    }

    /**
    * Table Header Render
    */
    const HeaderRender = () => {
        return (
            <div className="w-full flex flex-column md:flex-row justify-content-between md:justify-content-start align-items-start md:align-items-center gap-3">
                <Search
                    tooltipLabel={"search item by id, name, code, description,content,price,sell price,out of stock, status"}
                    placeholder={"Search item"}
                    onSearch={(e) => onSearchChange(e)}
                    label={translate.press_enter_key_to_search}
                />

                <div className="flex flex-column md:flex-row align-items-start md:align-items-end justify-content-center gap-3">
                    <FilterByStatus
                        status={itemStatus.current}
                        onFilter={(e) => onFilter(e)}
                        label={translate.filter_by}
                    />

                    <FilterByDate
                        onFilter={(e) => onFilterByDate(e)}
                        label={translate.filter_by_date}
                    />

                    <ExportExcel
                        url={endpoints.exportItem}
                    />

                    <ImportExcel
                        url={endpoints.importItem}
                        callback={loadingData}
                    />
                </div>
            </div>
        )
    }

    const SizeRender = ({ dataSource, size, index }) => {

        const style = {
            width: 'auto',
            height: 'auto',
            borderRadius: '10px',
            backgroundColor: '#fff',
            border: "1px solid #EA2B4A",
            color : '#EA2B4A',
            padding: "3px 5px",
            position: 'absolute',
            left: `${index * 20}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: `${index * 20}`
        }

        return <>
            <div
                style={style}
            >
                {size}
            </div>
            {
                dataSource?.length > 3 && (
                    <div
                        style={{
                            width: 'auto',
                            height: 'auto',
                            position: 'absolute',
                            left: '60px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: index * 20,
                            background: '#EA2B4A',
                            borderRadius: '10px',
                            border: '1px solid #EA2B4A',
                            color: "#fff",
                            padding: "3px 5px"
                        }}
                    >
                        <span>+{dataSource?.length - 3}</span>
                    </div>
                )
            }
        </>

    }

    const ColorRender = ({ dataSource, color, index }) => {
        const style = {
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: `${color}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            left: `${index * 20}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: `${index * 20}`
        }

        return <>
            <div
                style={style}
            >
            </div>
            {
                dataSource?.length > 3 && (
                    <div
                        style={{
                            width: '50px',
                            height: '50px',
                            position: 'absolute',
                            left: '60px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: index * 20,
                            background: '#DDDDDD',
                            color: "#000",
                            borderRadius: '50%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <span>+{dataSource?.length - 3}</span>
                    </div>
                )
            }
        </>

    }

    /** Render - Column Icon Field
    * @returns
    */
    const IconRender = ({ dataSource, image, isProduct = false, index }) => {
        const style = {
            position: isProduct ? 'absolute' : 'relative',
            left: isProduct ? `${index * 20}px` : 0,
            top: isProduct ? '50%' : 0,
            transform: isProduct ? 'translateY(-50%)' : 'none',
            zIndex: isProduct ? `${index * 20}` : 0
        };

        return (
            <div className=' relative'>
                <Avatar
                    key={index}
                    className="category-icon"
                    style={style}
                    icon="pi pi-image"
                    shape="circle"
                    image={image ? `${endpoints.image}/${image?.image}` : null}
                />
                {
                    dataSource?.length > 3 && (
                        <div
                            style={{
                                width: '50px',
                                height: '50px',
                                position: 'absolute',
                                left: '60px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: index * 20,
                                background: '#DDDDDD',
                                color: "#000",
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <span>+{dataSource?.length - 3}</span>
                        </div>
                    )
                }

            </div>
        );
    };


    return (
        <Card
            title={translate.item_list}
        >
            <DataTable
                dataKey="id"
                size="normal"
                value={items}
                sortField={paginateParams.order}
                sortOrder={paginateParams.sort === 'DESC' ? 1 : paginateParams.sort === 'ASC' ? -1 : 0}
                onSort={onSort}
                sortMode={paginateOptions.sortMode}
                loading={loading}
                emptyMessage="No item found."
                globalFilterFields={itemPayload.columns}
                header={<HeaderRender />}
                footer={<FooterRender />}
            >
                {showColumns.current.map((col, index) => {
                    return (
                        <Column
                            key={`item_col_index_${index}`}
                            style={{ minWidth: "250px" }}
                            field={col.field}
                            header={col.header}
                            sortable
                            body={(value) => {

                                switch (col.field) {
                                    case "id":
                                        return (
                                            <NavigateId
                                                url={`${paths.item}/${value[col.field]}`}
                                                value={value[col.field]}
                                            />
                                        );
                                    case "thumbnail_photo":
                                        return <IconRender image={value[col.field]} />;
                                    case "product_photo":
                                        return <Card
                                            style={{
                                                width: '100%',
                                                height: '100% !important',
                                                display: 'block',
                                                position: 'relative',
                                                boxShadow: 'none',
                                            }}
                                        >
                                            {value[col.field]?.slice(0, 3).map((img, imgIndex) => (
                                                <IconRender
                                                    key={`product_photo_${index}_${imgIndex}`}
                                                    image={img}
                                                    isProduct={true}
                                                    index={imgIndex}
                                                    dataSource={value[col.field]}
                                                />
                                            ))}
                                        </Card>

                                    case "item_color":
                                        return <div className=' relative'>
                                            {value[col.field]?.slice(0, 3).map((color, index) => {
                                                return <ColorRender
                                                        key={`color_${index}`}
                                                        color={color}
                                                        index={index}
                                                        dataSource={value[col.field]}
                                                       />
                                            })}
                                        </div>
                                    case "item_size":
                                        return <div className=' relative'>
                                            {value[col.field] && JSON.parse(value[col.field])?.slice(0, 3).map((size, index) => {
                                            return (
                                                <SizeRender 
                                                        key={`size_${index}`}
                                                        dataSource={JSON.parse(value[col.field])}
                                                        size={size}
                                                        index={index}
                                                   />
                                            )
                                        })}
                                        </div>
                                    case "status":
                                        return <Status status={value[col.field]} />;
                                    case "description":
                                        return <span>{value[col.field] === null ? 'no content' : value[col.field]?.length > 20 ? value[col.field].substring(0,20)+'...' : value[col.field]}</span>
                                    case "price":
                                        return <span>{value[col.field] === null ? 'no content' : value[col.field]}</span>
                                    case "content":
                                        return <div>
                                            {value[col.field] === null ? 'no content' : <div
                                                dangerouslySetInnerHTML={{ __html: value[col.field] }}
                                            />}
                                        </div>
                                    default:
                                        return value[col.field];
                                }
                            }}
                        />
                    )
                })}

                {showAuditColumn && auditColumns.map((col, index) => {
                    return (
                        <Column
                            key={`audit_column_key_${index}`}
                            style={{ minWidth: "250px" }}
                            field={col.field}
                            header={col.header}
                            sortable
                            body={(value) => <label> {datetime.long(value[col.field])} </label>}
                        />
                    )
                })}
            </DataTable>
            <Paginator
                first={first.current}
                rows={paginateParams.per_page}
                totalRecords={total?.current}
                rowsPerPageOptions={paginateOptions?.rowsPerPageOptions}
                template={"FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"}
                currentPageReportTemplate="Total - {totalRecords} | {currentPage} of {totalPages}"
                onPageChange={onPageChange}
            />
        </Card>
    )
}

export default ItemTableView